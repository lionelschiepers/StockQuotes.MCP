import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { randomUUID } from 'node:crypto';
import * as z from 'zod';
import type { StockQuotesService } from './stockQuotesService.js';
import { stockQuotesService } from './stockQuotesService.js';
import type { ServerConfig } from './types.js';

/**
 * MCP Server for Stock Quotes using Yahoo Finance
 */
export class StockQuotesServer {
  private server: McpServer;
  private config: ServerConfig;
  private stockService: StockQuotesService;
  private expressApp: express.Application;
  private transports: Map<string, StreamableHTTPServerTransport>;

  /**
   * Create a new instance of the StockQuotesServer
   * @param config - Server configuration
   */
  constructor(config: ServerConfig) {
    this.config = config;
    this.stockService = stockQuotesService;
    this.transports = new Map();

    // Initialize MCP server
    this.server = new McpServer({
      name: config.name,
      version: config.version,
    });

    // Register tools
    this.registerTools();

    // Setup Express app for HTTP/SSE transports
    this.expressApp = express();
    this.expressApp.use(express.json());
    this.setupExpressRoutes();
  }

  /**
   * Register all MCP tools
   */
  private registerTools(): void {
    this.server.registerTool(
      `get_stock_quote_${process.pid}`,
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
            .prefault([
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
          /*,
          regularMarketChange: z.number().optional(),
          regularMarketChangePercent: z.number().optional(),
          regularMarketVolume: z.number().optional(),
          marketCap: z.number().optional(),
          fiftyTwoWeekLow: z.number().optional(),
          fiftyTwoWeekHigh: z.number().optional(),
          averageDailyVolume3Month: z.number().optional(),
          trailingPE: z.number().optional(),
          forwardPE: z.number().optional(),
          dividendYield: z.number().optional(),
          marketState: z.string().optional(),*/
        },
      },
      async ({ ticker /*, fields*/ }) => {
        console.log(`Fetching stock quote for ticker: ${ticker}`);
        const quote = await this.stockService.getQuote({ ticker /*, fields*/ });

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

    this.server.registerTool(
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

    this.server.registerTool(
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
   * Setup Express routes for HTTP/SSE transports
   */
  private setupExpressRoutes(): void {
    // Main MCP endpoint
    this.expressApp.post('/mcp', async (req, res) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && this.transports.has(sessionId)) {
        // Reuse existing session
        transport = this.transports.get(sessionId)!;
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New session initialization
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            this.transports.set(id, transport);
            console.log(`Session initialized: ${id}`);
          },
          onsessionclosed: (id) => {
            this.transports.delete(id);
            console.log(`Session closed: ${id}`);
          },
        });

        await this.server.connect(transport);
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Invalid session' },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    });

    // Health check endpoint
    this.expressApp.get('/health', (req, res) => {
      res.json({ status: 'healthy', name: this.config.name, version: this.config.version });
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
      case 'sse':
        this.connectSSE();
        break;
      default:
        throw new Error(`Unsupported transport type: ${this.config.transport as string}`);
    }
  }

  /**
   * Connect using stdio transport
   */
  private async connectStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('MCP Server connected via stdio transport');
  }

  /**
   * Connect using HTTP transport
   */
  private connectHttp(): void {
    const port = this.config.httpPort ?? 3000;
    this.expressApp.listen(port, () => {
      console.log(`MCP Server running on http://localhost:${port}/mcp`);
    });
  }

  /**
   * Connect using SSE transport
   * Note: SSE is deprecated in favor of Streamable HTTP, but we support it for compatibility
   */
  private connectSSE(): void {
    const port = this.config.ssePort ?? 3001;
    this.expressApp.listen(port, () => {
      console.log(`MCP Server running on http://localhost:${port}/mcp (SSE compatible)`);
    });
  }

  /**
   * Get the Express app instance (for testing or custom transport setups)
   */
  getApp(): express.Application {
    return this.expressApp;
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
    ssePort: 3001,
    ...config,
  };

  const server = new StockQuotesServer(serverConfig);
  await server.connect();
  return server;
}
