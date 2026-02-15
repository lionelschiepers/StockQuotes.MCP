import YahooFinance from 'yahoo-finance2';
import type { YahooChartResponse, YahooQuote, YahooSearchResponse } from './types.js';

type QuoteOptions = Parameters<InstanceType<typeof YahooFinance>['quote']>[1];
type SearchOptions = Parameters<InstanceType<typeof YahooFinance>['search']>[1];
type SearchModuleOptions = Parameters<InstanceType<typeof YahooFinance>['search']>[2];
type ChartOptions = Parameters<InstanceType<typeof YahooFinance>['chart']>[1];
type ChartModuleOptions = Parameters<InstanceType<typeof YahooFinance>['chart']>[2];

export interface YahooClient {
  /**
   * Fetch stock quote(s) for a given symbol or symbols
   * @param symbol - Ticker symbol or array of symbols
   * @param options - Quote options
   * @returns Promise<YahooQuote | YahooQuote[]> - Quote data
   */
  quote(symbol: string | string[], options?: QuoteOptions): Promise<YahooQuote | YahooQuote[]>;

  /**
   * Search for stocks/companies
   * @param query - Search query
   * @param options - Search options
   * @param moduleOptions - Search module options
   * @returns Promise<YahooSearchResponse> - Search results
   */
  search(
    query: string,
    options?: SearchOptions,
    moduleOptions?: SearchModuleOptions
  ): Promise<YahooSearchResponse>;

  /**
   * Fetch chart data (historical data)
   * @param symbol - Ticker symbol
   * @param options - Chart options (period1, period2, interval, etc.)
   * @param moduleOptions - Chart module options
   * @returns Promise<YahooChartResponse> - Chart data
   */
  chart(
    symbol: string,
    options: ChartOptions,
    moduleOptions?: ChartModuleOptions
  ): Promise<YahooChartResponse>;
}

export class YahooFinanceClient implements YahooClient {
  private readonly client: InstanceType<typeof YahooFinance>;
  private static queue: Promise<void> = Promise.resolve();

  /**
   * Create a new YahooFinanceClient
   * @param client - Optional YahooFinance instance
   */
  constructor(client?: InstanceType<typeof YahooFinance>) {
    this.client = client ?? new YahooFinance();
  }

  /**
   * Enqueues a task to be executed sequentially.
   * Ensures only one Yahoo Finance call is active at a time across all instances.
   */
  private async enqueue<T>(task: () => Promise<T>): Promise<T> {
    const previous = YahooFinanceClient.queue;
    let resolveNext: () => void;
    YahooFinanceClient.queue = new Promise<void>((resolve) => {
      resolveNext = resolve;
    });

    try {
      await previous;
      return await task();
    } finally {
      resolveNext!();
    }
  }

  /**
   * Fetch stock quote(s) for a given symbol or symbols
   * @param symbol - Ticker symbol or array of symbols
   * @param options - Quote options
   * @returns Promise<YahooQuote | YahooQuote[]> - Quote data
   */
  async quote(
    symbol: string | string[],
    options?: QuoteOptions
  ): Promise<YahooQuote | YahooQuote[]> {
    return this.enqueue(
      async () => (await this.client.quote(symbol, options)) as YahooQuote | YahooQuote[]
    );
  }

  /**
   * Search for stocks/companies
   * @param query - Search query
   * @param options - Search options
   * @param moduleOptions - Search module options
   * @returns Promise<YahooSearchResponse> - Search results
   */
  async search(
    query: string,
    options?: SearchOptions,
    moduleOptions?: SearchModuleOptions
  ): Promise<YahooSearchResponse> {
    return this.enqueue(async () => {
      const result = await this.client.search(query, options, moduleOptions);
      return result as YahooSearchResponse;
    });
  }

  /**
   * Fetch chart data (historical data)
   * @param symbol - Ticker symbol
   * @param options - Chart options
   * @param moduleOptions - Chart module options
   * @returns Promise<YahooChartResponse> - Chart data
   */
  async chart(
    symbol: string,
    options: ChartOptions,
    moduleOptions?: ChartModuleOptions
  ): Promise<YahooChartResponse> {
    return this.enqueue(async () => {
      const result = await this.client.chart(symbol, options, moduleOptions);
      return result as YahooChartResponse;
    });
  }
}
