import * as z from 'zod';
import type { StockQuotesService } from './stockQuotesService.js';
import { stockQuotesService } from './stockQuotesService.js';
import { TransportFactory } from './transports/TransportFactory.js';
import type { TransportStrategy } from './transports/TransportStrategy.js';
import type { ServerConfig } from './types.js';

/**
 * MCP Server for Stock Quotes using Yahoo Finance
 */
export class StockQuotesServer {
  private config: ServerConfig;
  private stockService: StockQuotesService;
  private transportStrategy: TransportStrategy;

  /**
   * Create a new instance of the StockQuotesServer
   * @param config - Server configuration
   */
  constructor(config: ServerConfig) {
    this.config = config;
    this.stockService = stockQuotesService;
    this.transportStrategy = TransportFactory.createTransport(config, this.stockService);
  }

  /**
   * Register all MCP tools on a server instance
   */
  private registerToolsOnServer(server: any): void {
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
      async ({ ticker, fields }: { ticker: string; fields?: string[] }) => {
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
      async ({ query }: { query: string }) => {
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
      async ({
        ticker,
        fromDate,
        toDate,
      }: {
        ticker: string;
        fromDate: string;
        toDate: string;
      }) => {
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
   * Connect to the appropriate transport using the strategy pattern
   */
  async connect(): Promise<void> {
    // Register tools on the transport's server instance
    const server = this.transportStrategy.getServer();
    this.registerToolsOnServer(server);

    // Connect using the transport strategy
    await this.transportStrategy.connect();
  }

  /**
   * Get the Express app instance (for testing or custom transport setups)
   * Only available for HTTP transport
   */
  getApp(): any {
    // Check if the transport strategy has getApp method (HTTP transport)
    if (typeof (this.transportStrategy as any).getApp === 'function') {
      return (this.transportStrategy as any).getApp();
    }
    throw new Error('Express app is only available for HTTP transport');
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
