import {
  addDays,
  differenceInYears,
  format,
  isAfter,
  isValid,
  parseISO,
  startOfToday,
} from 'date-fns';
import NodeCache from 'node-cache';
import { NotFoundError, RateLimitError, ValidationError } from './errors.js';
import { logger } from './logger.js';
import type {
  HistoricalData,
  StockQuoteInput,
  StockQuoteResponse,
  StockQuotesInput,
  StockSearchResult,
  YahooChartResponse,
  YahooQuote,
  YahooSearchQuote,
  YahooSearchResponse,
} from './types.js';
import type { YahooClient } from './yahooFinanceClient.js';

/**
 * Service for fetching stock quotes from Yahoo Finance
 */
export class StockQuotesService {
  private readonly yahooClient: YahooClient;
  private readonly cache: NodeCache;

  /**
   * Create a new instance of the StockQuotesService
   */
  constructor(yahooClient: YahooClient) {
    this.yahooClient = yahooClient;
    // Cache for 5 minutes by default, check for expired keys every 60 seconds
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
  }

  /**
   * Fetch a stock quote for the given ticker symbol
   * @param input - The stock quote input containing the ticker and optional fields
   * @returns Promise<StockQuoteResponse> - The stock quote data
   */
  async getQuote(input: StockQuoteInput): Promise<StockQuoteResponse> {
    const { ticker, fields } = input;
    const cacheKey = `quote_${ticker}_${fields?.join(',') ?? 'all'}`;

    const cachedResponse = this.cache.get<StockQuoteResponse>(cacheKey);
    if (cachedResponse) {
      logger.debug('Cache hit for stock quote', { ticker, cacheKey });
      return cachedResponse;
    }

    try {
      const validFields = this.prepareFields(fields);
      const options = validFields ? { fields: validFields } : undefined;

      const result = await this.yahooClient.quote(ticker, options);

      if (!result) {
        throw new NotFoundError(`Stock ticker '${ticker}' not found`);
      }

      const quote = Array.isArray(result) ? result[0] : result;

      if (!quote) {
        throw new NotFoundError(`Stock ticker '${ticker}' not found`);
      }

      const response = this.mapToStockQuoteResponse(quote, ticker);

      this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('No definition') || error.message.includes('not found')) {
          throw new NotFoundError(`Stock ticker '${ticker}' not found`);
        }
        if (error.message.includes('rate limit')) {
          throw new RateLimitError();
        }
      }
      throw error;
    }
  }

  /**
   * Fetch multiple stock quotes for the given ticker symbols
   * @param input - The stock quotes input containing the tickers and optional fields
   * @returns Promise<StockQuoteResponse[]> - The stock quote data for each ticker
   */
  async getQuotes(input: StockQuotesInput): Promise<StockQuoteResponse[]> {
    const { tickers, fields } = input;
    const cacheKey = `quotes_${tickers.sort().join(',')}_${fields?.join(',') ?? 'all'}`;

    const cachedResponse = this.cache.get<StockQuoteResponse[]>(cacheKey);
    if (cachedResponse) {
      logger.debug('Cache hit for multiple stock quotes', { tickers, cacheKey });
      return cachedResponse;
    }

    try {
      const validFields = this.prepareFields(fields);
      const options = validFields ? { fields: validFields } : undefined;

      const results = await this.yahooClient.quote(tickers, options);

      if (!results) {
        throw new NotFoundError(`Stock tickers not found: ${tickers.join(', ')}`);
      }

      const quotes = Array.isArray(results) ? results : [results];

      const responses = quotes.map((quote) =>
        this.mapToStockQuoteResponse(quote, quote.symbol ?? 'unknown')
      );

      this.cache.set(cacheKey, responses);
      return responses;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new RateLimitError();
        }
      }
      throw error;
    }
  }

  /**
   * Prepares and transforms field requests for Yahoo Finance
   * @param fields - Optional list of fields requested by the client
   * @returns string[] | undefined - Transformed fields for Yahoo Finance
   */
  private prepareFields(fields?: string[]): string[] | undefined {
    if (!fields) return undefined;

    let validFields = fields.filter((field) => field.length > 0);

    if (validFields.includes('name')) {
      validFields = validFields.filter((f) => f !== 'name');
      if (!validFields.includes('shortName')) validFields.push('shortName');
      if (!validFields.includes('longName')) validFields.push('longName');
    }

    return validFields.length > 0 ? validFields : undefined;
  }

  /**
   * Maps a YahooQuote to a StockQuoteResponse
   * @param quote - YahooQuote object
   * @param ticker - Ticker symbol
   * @returns StockQuoteResponse
   */
  private mapToStockQuoteResponse(quote: YahooQuote, ticker: string): StockQuoteResponse {
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
        logger.error(`Failed to fetch quote for ${ticker}`, { ticker, error });
      }
    }

    return results;
  }

  /**
   * Search for a company by name or ticker
   * @param query - Search query string
   * @returns Promise<StockSearchResult[]> - Search results
   */
  async search(query: string): Promise<StockSearchResult[]> {
    const cacheKey = `search_${query}`;
    const cachedResults = this.cache.get<StockSearchResult[]>(cacheKey);

    if (cachedResults) {
      logger.debug('Cache hit for search', { query, cacheKey });
      return cachedResults;
    }

    const results: YahooSearchResponse = await this.yahooClient.search(query);
    const quotes = results.quotes ?? [];

    const searchResults = quotes
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

    // Cache search results for 30 minutes
    this.cache.set(cacheKey, searchResults, 1800);
    return searchResults;
  }

  /**
   * Fetches historical stock data for a given ticker, from a start date to an end date.
   * @param ticker - Stock ticker symbol (e.g., AAPL)
   * @param fromDate - Start date in 'YYYY-MM-DD' format
   * @param toDate - End date in 'YYYY-MM-DD' format
   * @returns Promise<HistoricalData[]> - An array of historical data points (date, close, high, low, volume).
   */
  async getHistoricalData(
    ticker: string,
    fromDate: string,
    toDate: string
  ): Promise<HistoricalData[]> {
    const fromDateObj = parseISO(fromDate);
    const toDateObj = parseISO(toDate);
    const today = startOfToday();

    if (!isValid(fromDateObj)) {
      throw new ValidationError(`Invalid fromDate: ${fromDate}. Use YYYY-MM-DD format.`);
    }
    if (!isValid(toDateObj)) {
      throw new ValidationError(`Invalid toDate: ${toDate}. Use YYYY-MM-DD format.`);
    }

    if (isAfter(fromDateObj, today)) {
      throw new ValidationError('fromDate cannot be in the future.');
    }

    if (isAfter(fromDateObj, toDateObj)) {
      throw new ValidationError('fromDate must be before or equal to toDate.');
    }

    if (differenceInYears(toDateObj, fromDateObj) > 5) {
      throw new ValidationError('Date range cannot exceed 5 years.');
    }

    try {
      // Yahoo Finance treats period2 as exclusive, so we add 1 day to include the end date
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
            close: Math.round(quote.close * 100) / 100,
            high: Math.round(quote.high * 100) / 100,
            low: Math.round(quote.low * 100) / 100,
            volume: quote.volume,
          });
        }
      }

      return historicalData;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      logger.error(`Error fetching historical data for ${ticker}`, { ticker, error });
      throw new NotFoundError(
        `Could not fetch historical data for ${ticker}. Please check the ticker and date range.`
      );
    }
  }
}
