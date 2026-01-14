import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { StockQuotesService } from './stockQuotesService.js';

/**
 * Register all MCP tools on a server instance
 * @param server - MCP server instance to register tools on
 * @param stockService - Stock quotes service instance
 */
export function registerToolsOnServer(server: McpServer, stockService: StockQuotesService): void {
  server.registerTool(
    `get_stock_quote`,
    {
      title: 'Get Stock Quote',
      description:
        'Fetch current stock quote data from Yahoo Finance for a given ticker symbol. ' +
        'Returns price, volume, market cap, P/E ratio, 52-week range, and other key metrics. ' +
        'Supports stocks, ETFs, cryptocurrencies, and other financial instruments.',
      inputSchema: z.object({
        ticker: z.string().min(1).max(10).describe('Stock ticker symbol (e.g., AAPL, GOOGL, MSFT)'),
        fields: z
          .array(z.string())
          .optional()
          .describe('Optional list of specific fields to return'),
      }),
    },
    async ({ ticker, fields }: { ticker: string; fields?: string[] }) => {
      console.log(`Fetching stock quote for ticker: ${ticker}`);
      const quote = await stockService.getQuote({ ticker, fields });

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
      inputSchema: z.object({
        query: z.string().min(1).describe('Search query (company name or ticker)'),
      }),
    },
    async ({ query }: { query: string }) => {
      console.log(`Searching stocks with query: ${query}`);
      const results = await stockService.search(query);

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
    `get_historical_data`,
    {
      title: 'Get Historical Data for a TICKER',
      description:
        'Fetch historical stock data for a given ticker, from a start date to an end date. Returns an array of closing prices for each day.',
      inputSchema: z.object({
        ticker: z.string().min(1).max(10).describe('Stock ticker symbol (e.g., AAPL)'),
        fromDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe('Start date in YYYY-MM-DD format'),
        toDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe('End date in YYYY-MM-DD format'),
      }),
    },
    async ({ ticker, fromDate, toDate }: { ticker: string; fromDate: string; toDate: string }) => {
      console.log(`Fetching historical data for ${ticker} from ${fromDate} to ${toDate}`);
      const closingPrices = await stockService.getHistoricalData(ticker, fromDate, toDate);
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
