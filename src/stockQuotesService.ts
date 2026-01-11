/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { format } from 'date-fns';
import type {
  HistoricalData,
  StockQuoteInput,
  StockQuoteResponse,
  StockSearchResult,
} from './types.js';
import type { YahooClient } from './yahooFinanceClient.js';

/**
 * Service for fetching stock quotes from Yahoo Finance
 */
export class StockQuotesService {
  private readonly yahooClient: YahooClient;

  /**
   * Create a new instance of the StockQuotesService
   */
  constructor(yahooClient: YahooClient) {
    this.yahooClient = yahooClient;
  }

  /**
   * Fetch a stock quote for the given ticker symbol
   * @param input - The stock quote input containing the ticker and optional fields
   * @returns Promise<StockQuoteResponse> - The stock quote data
   */
  async getQuote(input: StockQuoteInput): Promise<StockQuoteResponse> {
    const { ticker, fields } = input;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    try {
      // Fetch quote data from Yahoo Finance
      const options = fields ? { fields } : undefined;
      const result: any = await this.yahooClient.quote(ticker, options);

      // The yahoo-finance2 library can return a single quote, an array of quotes, or undefined.
      // We need to handle all cases to ensure type safety.
      if (!result) {
        throw new Error(`Stock ticker '${ticker}' not found`);
      }

      // If the result is an array, take the first element.
      const quote: any = Array.isArray(result) ? result[0] : result;

      // After potentially taking the first element, check if the quote itself is valid.
      if (!quote) {
        throw new Error(`Stock ticker '${ticker}' not found`);
      }

      // Transform the response to our interface, mapping all relevant fields.
      const response: StockQuoteResponse = {
        symbol: quote.symbol ?? ticker,
        name: quote.shortName ?? quote.longName,
        exchange: quote.exchange,
        currency: quote.currency,
        regularMarketPrice: quote.regularMarketPrice,
        regularMarketChange: quote.regularMarketChange,
        regularMarketChangePercent: quote.regularMarketChangePercent,
        regularMarketVolume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        averageDailyVolume3Month: quote.averageDailyVolume3Month,
        trailingPE: quote.trailingPE,
        forwardPE: quote.forwardPE,
        dividendYield: quote.dividendYield,
        epsTrailingTwelveMonths: quote.epsTrailingTwelveMonths,
        epsForward: quote.epsForward,
        bookValue: quote.bookValue,
        priceToBook: quote.priceToBook,
        marketState: quote.marketState,
        quoteType: quote.quoteType,
      };

      // Remove any properties that are undefined to keep the response clean.
      Object.keys(response).forEach(
        (key) =>
          response[key as keyof StockQuoteResponse] === undefined &&
          delete response[key as keyof StockQuoteResponse]
      );

      return response;
    } catch (error) {
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('No definition') || error.message.includes('not found')) {
          throw new Error(`Stock ticker '${ticker}' not found`);
        }
        if (error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please try again later');
        }
      }
      throw error;
    } finally {
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }
  }

  /**
   * Fetch multiple stock quotes at once
   * @param tickers - Array of ticker symbols
   * @returns Promise<Map<string, StockQuoteResponse>> - Map of ticker to stock quote data
   */
  async getMultipleQuotes(tickers: string[]): Promise<Map<string, StockQuoteResponse>> {
    const results = new Map<string, StockQuoteResponse>();

    for (const ticker of tickers) {
      try {
        const quote = await this.getQuote({ ticker });
        results.set(ticker, quote);
      } catch (error) {
        // Log the error for the individual ticker but continue with the rest
        console.error(`Failed to fetch quote for ${ticker}:`, error);
      }
    }

    return results;
  }

  /**
   * Search for a company by name or ticker
   * @param query - Search query string
   * @returns Promise<Array<{symbol: string, name: string, exchange: string}>> - Search results
   */
  async search(query: string): Promise<StockSearchResult[]> {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const results: any = await this.yahooClient.search(query);
    const quotes: any[] = results.quotes ?? []; // Explicitly type as any[]

    return (quotes as StockSearchResult[]) // Cast the array to StockSearchResult[] here
      .filter(
        (quote: any): quote is StockSearchResult =>
          typeof quote.symbol === 'string' &&
          typeof quote.exchange === 'string' &&
          (typeof quote.shortname === 'string' || typeof quote.longname === 'string')
      )
      .map(
        (result: any): StockSearchResult => ({
          symbol: result.symbol,
          name: result.shortname ?? result.longname ?? '',
          exchange: result.exchange,
        })
      );
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }

  /**
   * Fetches historical stock data for a given ticker, from a start date to an end date.
   * @param ticker - Stock ticker symbol (e.g., AAPL)
   * @param fromDate - Start date in 'YYYY-MM-DD' format
   * @param toDate - End date in 'YYYY-MM-DD' format
   * @returns Promise<number[]> - An array of closing prices for each day.
   */
  async getHistoricalData(
    ticker: string,
    fromDate: string,
    toDate: string
  ): Promise<HistoricalData[]> {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    try {
      const chart: any = await this.yahooClient.chart(ticker, {
        period1: fromDate,
        period2: toDate,
      });
      const historicalData: HistoricalData[] = [];

      for (const quote of chart.quotes) {
        if (quote.date && quote.close && quote.high && quote.low && quote.volume) {
          historicalData.push({
            date: format(new Date(quote.date), 'yyyy-MM-dd'),
            close: quote.close,
            high: quote.high,
            low: quote.low,
            volume: quote.volume,
          });
        }
      }

      return historicalData;
    } catch (error) {
      console.error(`Error fetching historical data for ${ticker}:`, error);
      throw new Error(
        `Could not fetch historical data for ${ticker}. Please check the ticker and date range.`
      );
    } finally {
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }
  }
}
