import YahooFinance from 'yahoo-finance2';

export interface YahooClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quote(symbol: string, options?: object): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  search(query: string, options?: any, moduleOptions?: object): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chart(symbol: string, options?: any, moduleOptions?: object): Promise<any>;
}

export class YahooFinanceClient implements YahooClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(client?: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.client = client ?? new YahooFinance();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quote(symbol: string, options?: object): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.client.quote(symbol, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  search(query: string, options?: any, moduleOptions?: object): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.client.search(query, options, moduleOptions);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chart(symbol: string, options?: any, moduleOptions?: object): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.client.chart(symbol, options, moduleOptions);
  }
}
