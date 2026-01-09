import YahooFinance from 'yahoo-finance2';
import type { StockQuoteInput, StockQuoteResponse } from './types.js';

/**
 * Service for fetching stock quotes from Yahoo Finance
 */
export class StockQuotesService {
  private yahooFinance: any;

  /**
   * Create a new instance of the StockQuotesService
   */
  constructor() {
    this.yahooFinance = new YahooFinance();
  }

  /**
   * Fetch a stock quote for the given ticker symbol
   * @param input - The stock quote input containing the ticker and optional fields
   * @returns Promise<StockQuoteResponse> - The stock quote data
   */
  async getQuote(input: StockQuoteInput): Promise<StockQuoteResponse> {
    const { ticker /*, fields*/ } = input;

    try {
      // Fetch quote data from Yahoo Finance
      const quote = await this.yahooFinance.quote(
        ticker /*, {
        fields: fields as never,
      }*/
      );

      // Transform the response to our interface
      const response: StockQuoteResponse = {
        symbol: (quote as { symbol?: string }).symbol ?? ticker,
        name:
          (quote as { shortName?: string | null }).shortName ??
          (quote as { longName?: string | null }).longName ??
          undefined,
        currency: (quote as { currency?: string }).currency,
        exchange: (quote as { exchange?: string }).exchange,
        price: (quote as { regularMarketPrice?: number }).regularMarketPrice,
        /*
        regularMarketChange: (quote as { regularMarketChange?: number }).regularMarketChange,
        regularMarketChangePercent: (quote as { regularMarketChangePercent?: number })
          .regularMarketChangePercent,
        regularMarketVolume: (quote as { regularMarketVolume?: number }).regularMarketVolume,
        marketCap: (quote as { marketCap?: number }).marketCap,
        fiftyTwoWeekLow: (quote as { fiftyTwoWeekLow?: number }).fiftyTwoWeekLow,
        fiftyTwoWeekHigh: (quote as { fiftyTwoWeekHigh?: number }).fiftyTwoWeekHigh,
        averageDailyVolume3Month: (quote as { averageDailyVolume3Month?: number })
          .averageDailyVolume3Month,
        trailingPE: (quote as { trailingPE?: number }).trailingPE,
        forwardPE: (quote as { forwardPE?: number }).forwardPE,
        dividendYield: (quote as { dividendYield?: number }).dividendYield,
        epsTrailingTwelveMonths: (quote as { epsTrailingTwelveMonths?: number })
          .epsTrailingTwelveMonths,
        epsForward: (quote as { epsForward?: number }).epsForward,
        bookValue: (quote as { bookValue?: number }).bookValue,
        priceToBook: (quote as { priceToBook?: number }).priceToBook,
        marketState: (quote as { marketState?: string }).marketState,
        quoteType: (quote as { quoteType?: string }).quoteType,*/
      };

      return response;
    } catch (error) {
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('No definition')) {
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
    const quotes = await this.yahooFinance.quote(tickers);
    const result = new Map<string, StockQuoteResponse>();

    for (const ticker of tickers) {
      const quote = quotes[ticker as keyof typeof quotes];
      if (quote) {
        result.set(ticker, await this.getQuote({ ticker }));
      }
    }

    return result;
  }

  /**
   * Search for a company by name or ticker
   * @param query - Search query string
   * @returns Promise<Array<{symbol: string, name: string, exchange: string}>> - Search results
   */
  async search(query: string): Promise<Array<{ symbol: string; name: string; exchange: string }>> {
    const results = await this.yahooFinance.search(query);
    // The search result has a quotes array with the actual results
    const quotes =
      (
        results as {
          quotes?: Array<{
            symbol: string;
            shortname?: string | null;
            longname?: string | null;
            exchange: string;
          }>;
        }
      ).quotes ?? [];
    return quotes.map((result) => ({
      symbol: result.symbol,
      name: result.shortname ?? result.longname ?? '',
      exchange: result.exchange,
    }));
  }
}

// Export a singleton instance for convenience
export const stockQuotesService = new StockQuotesService();
