import YahooFinance from 'yahoo-finance2';
import type { YahooChartResponse, YahooQuote, YahooSearchResponse } from './types.js';

export interface YahooClient {
  quote(symbol: string, options?: object): Promise<YahooQuote | YahooQuote[]>;
  search(query: string, options?: unknown, moduleOptions?: object): Promise<YahooSearchResponse>;
  chart(symbol: string, options?: unknown, moduleOptions?: object): Promise<YahooChartResponse>;
}

export class YahooFinanceClient implements YahooClient {
  private readonly client: InstanceType<typeof YahooFinance>;

  constructor(client?: InstanceType<typeof YahooFinance>) {
    this.client = client ?? new YahooFinance();
  }

  async quote(symbol: string, options?: object): Promise<YahooQuote | YahooQuote[]> {
    const result = await this.client.quote(symbol, options);
    return result as YahooQuote | YahooQuote[];
  }

  async search(
    query: string,
    options?: unknown,
    moduleOptions?: object
  ): Promise<YahooSearchResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const result = await this.client.search(query, options as any, moduleOptions);
    return result as YahooSearchResponse;
  }

  async chart(
    symbol: string,
    options?: unknown,
    moduleOptions?: object
  ): Promise<YahooChartResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const result = await this.client.chart(symbol, options as any, moduleOptions);
    return result as YahooChartResponse;
  }
}
