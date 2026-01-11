import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

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
  quote(symbol: string, options?: object): Promise<any> {
    return yahooFinance.quote(symbol, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  search(query: string, options?: any, moduleOptions?: object): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return yahooFinance.search(query, options, moduleOptions);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chart(symbol: string, options?: any, moduleOptions?: object): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return yahooFinance.chart(symbol, options, moduleOptions);
  }
}
