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

// Schema for multiple stock quotes tool input
export const StockQuotesSchema = z.object({
  tickers: z
    .array(
      z
        .string()
        .min(1)
        .max(10)
        .toUpperCase()
        .describe('Stock ticker symbol (e.g., AAPL, GOOGL, MSFT)')
    )
    .min(1)
    .describe('List of stock ticker symbols'),
  fields: z.array(z.string()).optional().describe('Optional list of specific fields to return'),
});

// Schema for stock search tool input
export const StockSearchSchema = z.object({
  query: z.string().min(1).describe('Search query (company name or ticker)'),
});

// Schema for historical data tool input
export const HistoricalDataSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase().describe('Stock ticker symbol (e.g., AAPL)'),
  fromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Start date in YYYY-MM-DD format'),
  toDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('End date in YYYY-MM-DD format'),
});

// Type for stock quote tool input
export type StockQuoteInput = z.infer<typeof StockQuoteSchema>;
export type StockQuotesInput = z.infer<typeof StockQuotesSchema>;
export type StockSearchInput = z.infer<typeof StockSearchSchema>;
export type HistoricalDataInput = z.infer<typeof HistoricalDataSchema>;

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
  httpHost?: string;
}

// Yahoo Finance API Types

export interface YahooQuote {
  symbol?: string;
  shortName?: string;
  longName?: string;
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

export interface YahooSearchQuote {
  symbol?: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  [key: string]: unknown;
}

export interface YahooSearchResponse {
  quotes?: YahooSearchQuote[];
  [key: string]: unknown;
}

export interface YahooHistoricalQuote {
  date?: number | Date;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  adjClose?: number;
  volume?: number;
  [key: string]: unknown;
}

export interface YahooChartResponse {
  quotes?: YahooHistoricalQuote[];
  meta?: {
    symbol?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
