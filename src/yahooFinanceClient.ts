import YahooFinance from 'yahoo-finance2';
import type { YahooChartResponse, YahooQuote, YahooSearchResponse } from './types.js';

type QuoteOptions = Parameters<InstanceType<typeof YahooFinance>['quote']>[1];
type SearchOptions = Parameters<InstanceType<typeof YahooFinance>['search']>[1];
type SearchModuleOptions = Parameters<InstanceType<typeof YahooFinance>['search']>[2];
type ChartOptions = Parameters<InstanceType<typeof YahooFinance>['chart']>[1];
type ChartModuleOptions = Parameters<InstanceType<typeof YahooFinance>['chart']>[2];

export interface YahooClient {
  quote(symbol: string, options?: QuoteOptions): Promise<YahooQuote | YahooQuote[]>;
  search(
    query: string,
    options?: SearchOptions,
    moduleOptions?: SearchModuleOptions
  ): Promise<YahooSearchResponse>;
  chart(
    symbol: string,
    options: ChartOptions,
    moduleOptions?: ChartModuleOptions
  ): Promise<YahooChartResponse>;
}

export class YahooFinanceClient implements YahooClient {
  private readonly client: InstanceType<typeof YahooFinance>;

  constructor(client?: InstanceType<typeof YahooFinance>) {
    this.client = client ?? new YahooFinance();
  }

  async quote(symbol: string, options?: QuoteOptions): Promise<YahooQuote | YahooQuote[]> {
    const result = await this.client.quote(symbol, options);
    return result as YahooQuote | YahooQuote[];
  }

  async search(
    query: string,
    options?: SearchOptions,
    moduleOptions?: SearchModuleOptions
  ): Promise<YahooSearchResponse> {
    const result = await this.client.search(query, options, moduleOptions);
    return result as YahooSearchResponse;
  }

  async chart(
    symbol: string,
    options: ChartOptions,
    moduleOptions?: ChartModuleOptions
  ): Promise<YahooChartResponse> {
    const result = await this.client.chart(symbol, options, moduleOptions);
    return result as YahooChartResponse;
  }
}

