import { z } from 'zod';

// Schema for stock quote tool input
export const StockQuoteSchema = z.object({
  ticker: z
    .string()
    .min(1)
    .max(10)
    .toUpperCase()
    .describe('Stock ticker symbol (e.g., AAPL, GOOGL, MSFT)'),
  fields: z.array(z.string()).optional().describe('Optional list of specific fields to return'),
});

// Type for stock quote tool input
export type StockQuoteInput = z.infer<typeof StockQuoteSchema>;

// Interface for stock quote response
export interface StockQuoteResponse {
  symbol: string;
  name?: string;
  exchange?: string;
  currency?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  marketCap?: number;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
  averageDailyVolume3Month?: number;
  trailingPE?: number;
  forwardPE?: number;
  dividendYield?: number;
  epsTrailingTwelveMonths?: number;
  epsForward?: number;
  bookValue?: number;
  priceToBook?: number;
  marketState?: string;
  quoteType?: string;
  [key: string]: unknown;
}

// Interface for stock search result
export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

// Interface for historical data
export interface HistoricalData {
  date: string;
  close: number;
  high: number;
  low: number;
  volume: number;
}

// Transport types
export type TransportType = 'stdio' | 'http';

// Server configuration interface
export interface ServerConfig {
  name: string;
  version: string;
  transport: TransportType;
  httpPort?: number;
}
