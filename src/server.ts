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
      'get_stock_quote',
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
            .describe('Optional list of specific fields to return'),
        },
        outputSchema: {
          symbol: z.string(),
          name: z.string().optional(),
          exchange: z.string().optional(),
          currency: z.string().optional(),
          regularMarketPrice: z.number().optional(),
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
          marketState: z.string().optional(),
        },
      },
      async ({ ticker, fields }) => {
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

      transport.handleRequest(req, res, req.body);
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
        await this.connectHttp();
        break;
      case 'sse':
        await this.connectSSE();
        break;
      default:
        throw new Error(`Unsupported transport type: ${this.config.transport}`);
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
  private async connectHttp(): Promise<void> {
    const port = this.config.httpPort ?? 3000;
    void this.expressApp.listen(port, () => {
      console.log(`MCP Server running on http://localhost:${port}/mcp`);
    });
  }

  /**
   * Connect using SSE transport
   * Note: SSE is deprecated in favor of Streamable HTTP, but we support it for compatibility
   */
  private async connectSSE(): Promise<void> {
    const port = this.config.ssePort ?? 3001;
    void this.expressApp.listen(port, () => {
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
