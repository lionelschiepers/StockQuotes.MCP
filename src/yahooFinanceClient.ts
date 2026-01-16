import YahooFinance from 'yahoo-finance2';
import type { YahooChartResponse, YahooQuote, YahooSearchResponse } from './types.js';

export interface YahooClient {
  quote(symbol: string, options?: object): Promise<YahooQuote | YahooQuote[]>;
  search(query: string, options?: unknown, moduleOptions?: object): Promise<YahooSearchResponse>;
  chart(symbol: string, options?: unknown, moduleOptions?: object): Promise<YahooChartResponse>;
}

export class YahooFinanceClient implements YahooClient {
  private readonly client: unknown;

  constructor(client?: unknown) {
    this.client = client ?? new YahooFinance();
  }

  async quote(symbol: string, options?: object): Promise<YahooQuote | YahooQuote[]> {
    const result = await (this.client as { quote(s: string, o?: object): Promise<unknown> }).quote(
      symbol,
      options
    );
    return result as YahooQuote | YahooQuote[];
  }

  async search(
    query: string,
    options?: unknown,
    moduleOptions?: object
  ): Promise<YahooSearchResponse> {
    const result = await (
      this.client as { search(q: string, o?: unknown, m?: object): Promise<unknown> }
    ).search(query, options, moduleOptions);
    return result as YahooSearchResponse;
  }

  async chart(
    symbol: string,
    options?: unknown,
    moduleOptions?: object
  ): Promise<YahooChartResponse> {
    const result = await (
      this.client as { chart(s: string, o?: unknown, m?: object): Promise<unknown> }
    ).chart(symbol, options, moduleOptions);
    return result as YahooChartResponse;
  }
}
