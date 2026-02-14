import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from './logger.js';
import type { StockQuotesService } from './stockQuotesService.js';
import {
  HistoricalDataSchema,
  StockQuoteSchema,
  StockQuotesSchema,
  StockSearchSchema,
} from './types.js';

/**
 * Register all MCP tools on a server instance
 * @param server - MCP server instance to register tools on
 * @param stockService - Stock quotes service instance
 */
export function registerToolsOnServer(server: McpServer, stockService: StockQuotesService): void {
  server.registerTool(
    'get_stock_quote',
    {
      title: 'Get Stock Quote',
      description:
        'Fetch current stock quote data from Yahoo Finance for a given ticker symbol. ' +
        'Returns price, volume, market cap, P/E ratio, 52-week range, and other key metrics. ' +
        'Supports stocks, ETFs, cryptocurrencies, and other financial instruments.',
      inputSchema: StockQuoteSchema,
    },
    async ({ ticker, fields }) => {
      logger.info('Fetching stock quote', { ticker, fields });
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
    'get_stock_quotes',
    {
      title: 'Get Multiple Stock Quotes',
      description:
        'Fetch current stock quote data from Yahoo Finance for multiple ticker symbols in a single request. ' +
        'Returns price, volume, market cap, and other key metrics for each ticker. ' +
        'Supports stocks, ETFs, cryptocurrencies, and other financial instruments.',
      inputSchema: StockQuotesSchema,
    },
    async ({ tickers, fields }) => {
      logger.info('Fetching multiple stock quotes', { tickers, fields });
      const quotes = await stockService.getQuotes({ tickers, fields });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(quotes, null, 2),
          },
        ],
        structuredContent: { quotes },
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
      inputSchema: StockSearchSchema,
    },
    async ({ query }) => {
      logger.info('Searching stocks', { query });
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
    'get_historical_data',
    {
      title: 'Get Historical Data for a TICKER',
      description:
        'Fetch historical stock data for a given ticker, from a start date to an end date. Returns an array of closing prices for each day.',
      inputSchema: HistoricalDataSchema,
    },
    async ({ ticker, fromDate, toDate }) => {
      logger.info('Fetching historical data', { ticker, fromDate, toDate });
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
