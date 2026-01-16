import { addDays, format, parseISO } from 'date-fns';
import type {
  HistoricalData,
  StockQuoteInput,
  StockQuoteResponse,
  StockSearchResult,
  YahooChartResponse,
  YahooSearchQuote,
  YahooSearchResponse,
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

    try {
      const validFields = fields ? fields.filter((field: string) => field.length > 0) : undefined;
      const options = validFields ? { fields: validFields } : undefined;
      const result = await this.yahooClient.quote(ticker, options);

      if (!result) {
        throw new Error(`Stock ticker '${ticker}' not found`);
      }

      const quote = Array.isArray(result) ? result[0] : result;

      if (!quote) {
        throw new Error(`Stock ticker '${ticker}' not found`);
      }

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

      Object.keys(response).forEach(
        (key) =>
          response[key as keyof StockQuoteResponse] === undefined &&
          delete response[key as keyof StockQuoteResponse]
      );

      return response;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('No definition') || error.message.includes('not found')) {
          throw new Error(`Stock ticker '${ticker}' not found`);
        }
        if (error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please try again later');
        }
      }
      throw error;
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
    const results: YahooSearchResponse = await this.yahooClient.search(query);
    const quotes = results.quotes ?? [];

    return quotes
      .filter(
        (
          quote: YahooSearchQuote
        ): quote is YahooSearchQuote & {
          symbol: string;
          exchange: string;
          shortname?: string;
          longname?: string;
        } =>
          typeof quote.symbol === 'string' &&
          typeof quote.exchange === 'string' &&
          (typeof quote.shortname === 'string' || typeof quote.longname === 'string')
      )
      .map(
        (result): StockSearchResult => ({
          symbol: result.symbol,
          name: result.shortname ?? result.longname ?? '',
          exchange: result.exchange,
        })
      );
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
    try {
      // Yahoo Finance treats period2 as exclusive, so we add 1 day to include the end date
      const toDateObj = parseISO(toDate);
      const period2 = format(addDays(toDateObj, 1), 'yyyy-MM-dd');

      const chart: YahooChartResponse = await this.yahooClient.chart(ticker, {
        period1: fromDate,
        period2,
      });
      const historicalData: HistoricalData[] = [];

      const quotes = chart.quotes ?? [];
      for (const quote of quotes) {
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
    }
  }
}
