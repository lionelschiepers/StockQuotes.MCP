import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type express from 'express';
import * as z from 'zod';
import type { StockQuotesService } from './stockQuotesService.js';
import { stockQuotesService } from './stockQuotesService.js';
import type { ServerConfig } from './types.js';

/**
 * MCP Server for Stock Quotes using Yahoo Finance
 */
export class StockQuotesServer {
  private config: ServerConfig;
  private stockService: StockQuotesService;
  private expressApp?: express.Application;

  /**
   * Create a new instance of the StockQuotesServer
   * @param config - Server configuration
   */
  constructor(config: ServerConfig) {
    this.config = config;
    this.stockService = stockQuotesService;
  }

  /**
   * Register all MCP tools on a server instance
   */
  private registerToolsOnServer(server: McpServer): void {
    server.registerTool(
      `get_stock_quote`,
      {
        title: 'Get Stock Quote',
        description:
          'Fetch current stock quote data from Yahoo Finance for a given ticker symbol. ' +
          'Returns price, volume, market cap, P/E ratio, 52-week range, and other key metrics. ' +
          'Supports stocks, ETFs, cryptocurrencies, and other financial instruments.',
        inputSchema: {
          ticker: z
            .string()
            .min(1)
            .max(10)
            .describe('Stock ticker symbol (e.g., AAPL, GOOGL, MSFT)'),
          fields: z
            .array(z.string())
            .optional()
            .default([
              'symbol',
              'shortName',
              'longName',
              'currency',
              'exchange',
              'regularMarketPrice',
            ])
            .describe('Optional list of specific fields to return'),
        },
        outputSchema: {
          symbol: z.string().describe('Stock ticker symbol'),
          name: z.string().optional().describe('Full name of the company or instrument'),
          currency: z.string().optional().describe('Currency of the stock price'),
          exchange: z.string().optional().describe('Exchange where the stock is listed'),
          price: z.number().optional().describe('Current market price'),
        },
      },
      async ({ ticker, fields }) => {
        console.log(`Fetching stock quote for ticker: ${ticker}`);
        const quote = await this.stockService.getQuote({ ticker, fields });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(quote, null, 2),
            },
          ],
          structuredContent: quote,
        };
      }
    );

    server.registerTool(
      'search_stocks',
      {
        title: 'Search Stocks',
        description:
          'Search for stocks by company name or ticker symbol. ' +
          'Returns matching results with symbol, name, and exchange information.',
        inputSchema: {
          query: z.string().min(1).describe('Search query (company name or ticker)'),
        },
        outputSchema: {
          results: z.array(
            z.object({
              symbol: z.string(),
              name: z.string(),
              exchange: z.string(),
            })
          ),
        },
      },
      async ({ query }) => {
        console.log(`Searching stocks with query: ${query}`);
        const results = await this.stockService.search(query);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
          structuredContent: { results },
        };
      }
    );

    server.registerTool(
      `get_historical_data_${process.pid}`,
      {
        title: 'Get Historical Data for a TICKER',
        description:
          'Fetch historical stock data for a given ticker, from a start date to an end date. Returns an array of closing prices for each day.',
        inputSchema: {
          ticker: z.string().min(1).max(10).describe('Stock ticker symbol (e.g., AAPL)'),
          fromDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .describe('Start date in YYYY-MM-DD format'),
          toDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .describe('End date in YYYY-MM-DD format'),
        },
        outputSchema: {
          closingPrices: z
            .array(
              z.object({
                date: z.string().describe('Date in YYYY-MM-DD format'),
                close: z.number().optional().describe('Closing price on that date'),
                high: z.number().optional().describe('Higher price on that date'),
                low: z.number().optional().describe('Lowest price on that date'),
                volume: z.number().optional().describe('Exchanged volume on that date'),
              })
            )
            .describe('An array of objects representing the closing prices for each day.'),
        },
      },
      async ({ ticker, fromDate, toDate }) => {
        console.log(`Fetching historical data for ${ticker} from ${fromDate} to ${toDate}`);
        const closingPrices = await this.stockService.getHistoricalData(ticker, fromDate, toDate);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ closingPrices }, null, 2),
            },
          ],
          structuredContent: { closingPrices },
        };
      }
    );
  }

  /**
   * Setup Express routes for stateless Streamable HTTP transport
   */
  private setupExpressRoutes(): void {
    this.expressApp ??= createMcpExpressApp();

    // Main MCP endpoint for stateless Streamable HTTP
    this.expressApp.post('/mcp', async (req, res) => {
      try {
        // Create a new MCP server instance for each request (stateless)
        const server = new McpServer({
          name: this.config.name,
          version: this.config.version,
        });

        // Register tools on the server
        this.registerToolsOnServer(server);

        // Create stateless transport (no session tracking)
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined, // Stateless - no session tracking
        });

        // Connect server to transport
        await server.connect(transport);

        // Handle the request
        await transport.handleRequest(req, res, req.body);

        // Clean up when request is closed
        res.on('close', async () => {
          await transport.close();
          await server.close();
        });
      } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          });
        }
      }
    });

    // Health check endpoint
    this.expressApp.get('/health', (req, res) => {
      res.json({ status: 'healthy', name: this.config.name, version: this.config.version });
    });

    // Disallow GET and DELETE methods on /mcp endpoint
    this.expressApp.get('/mcp', (req, res) => {
      res.status(405).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.',
        },
        id: null,
      });
    });

    this.expressApp.delete('/mcp', (req, res) => {
      res.status(405).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.',
        },
        id: null,
      });
    });
  }

  /**
   * Connect to the appropriate transport
   */
  async connect(): Promise<void> {
    switch (this.config.transport) {
      case 'stdio':
        await this.connectStdio();
        break;
      case 'http':
        this.connectHttp();
        break;
      default:
        throw new Error(`Unsupported transport type: ${this.config.transport as string}`);
    }
  }

  /**
   * Connect using stdio transport
   */
  private async connectStdio(): Promise<void> {
    const server = new McpServer({
      name: this.config.name,
      version: this.config.version,
    });

    // Register tools on the server
    this.registerToolsOnServer(server);

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('MCP Server connected via stdio transport');
  }

  /**
   * Connect using HTTP transport
   */
  private connectHttp(): void {
    // Initialize Express app only when needed for HTTP transport
    this.setupExpressRoutes();

    const port = this.config.httpPort ?? 3000;
    this.expressApp?.listen(port, () => {
      console.log(`MCP Server running on http://localhost:${port}/mcp`);
    });
  }

  /**
   * Get the Express app instance (for testing or custom transport setups)
   */
  getApp(): express.Application {
    if (!this.expressApp) {
      this.setupExpressRoutes();
    }
    return this.expressApp!;
  }
}

/**
 * Factory function to create and start the server
 */
export async function createServer(config?: Partial<ServerConfig>): Promise<StockQuotesServer> {
  const serverConfig: ServerConfig = {
    name: 'stock-quotes-server',
    version: '1.0.0',
    transport: 'stdio',
    httpPort: 3000,
    ...config,
  };

  const server = new StockQuotesServer(serverConfig);
  await server.connect();
  return server;
}
