import { YahooFinanceClient } from '../src/yahooFinanceClient.js';

describe('YahooFinanceClient', () => {
  let client: YahooFinanceClient;
  let mockYahooInstance: {
    quote: jest.Mock;
    search: jest.Mock;
    chart: jest.Mock;
  };

  beforeEach(() => {
    // Create a mock object that mimics the YahooFinance instance
    mockYahooInstance = {
      quote: jest.fn(),
      search: jest.fn(),
      chart: jest.fn(),
    };

    // Inject the mock into the client
    client = new YahooFinanceClient(mockYahooInstance as any);
  });

  it('should call yahooFinance.quote', async () => {
    mockYahooInstance.quote.mockResolvedValue({ symbol: 'AAPL', price: 150 });

    const result = await client.quote('AAPL', { fields: ['price'] });

    expect(mockYahooInstance.quote).toHaveBeenCalledWith('AAPL', { fields: ['price'] });
    expect(result).toEqual({ symbol: 'AAPL', price: 150 });
  });

  it('should call yahooFinance.search', async () => {
    mockYahooInstance.search.mockResolvedValue({ quotes: [] });

    const result = await client.search('Apple');

    expect(mockYahooInstance.search).toHaveBeenCalledWith('Apple', undefined, undefined);
    expect(result).toEqual({ quotes: [] });
  });

  it('should call yahooFinance.chart', async () => {
    mockYahooInstance.chart.mockResolvedValue({ quotes: [] });

    const result = await client.chart('AAPL', { period1: '2023-01-01' });

    expect(mockYahooInstance.chart).toHaveBeenCalledWith('AAPL', { period1: '2023-01-01' }, undefined);
    expect(result).toEqual({ quotes: [] });
  });

  it('should serialize multiple concurrent calls', async () => {
    const callOrder: string[] = [];
    
    mockYahooInstance.quote.mockImplementation(async () => {
      callOrder.push('quote-start');
      await new Promise(resolve => setTimeout(resolve, 50));
      callOrder.push('quote-end');
      return { symbol: 'AAPL' };
    });

    mockYahooInstance.search.mockImplementation(async () => {
      callOrder.push('search-start');
      await new Promise(resolve => setTimeout(resolve, 10));
      callOrder.push('search-end');
      return { quotes: [] };
    });

    // Start both calls concurrently
    const quotePromise = client.quote('AAPL');
    const searchPromise = client.search('Apple');

    await Promise.all([quotePromise, searchPromise]);

    // Verify that search started only after quote finished
    expect(callOrder).toEqual([
      'quote-start',
      'quote-end',
      'search-start',
      'search-end'
    ]);
  });

  it('should serialize calls across multiple instances', async () => {
    const callOrder: string[] = [];
    
    // Create two different mock instances
    const mock1 = { quote: jest.fn() };
    const mock2 = { search: jest.fn() };
    
    const client1 = new YahooFinanceClient(mock1 as any);
    const client2 = new YahooFinanceClient(mock2 as any);

    mock1.quote.mockImplementation(async () => {
      callOrder.push('client1-start');
      await new Promise(resolve => setTimeout(resolve, 50));
      callOrder.push('client1-end');
      return { symbol: 'AAPL' };
    });

    mock2.search.mockImplementation(async () => {
      callOrder.push('client2-start');
      await new Promise(resolve => setTimeout(resolve, 10));
      callOrder.push('client2-end');
      return { quotes: [] };
    });

    // Start calls from different instances concurrently
    const p1 = client1.quote('AAPL');
    const p2 = client2.search('Apple');

    await Promise.all([p1, p2]);

    expect(callOrder).toEqual([
      'client1-start',
      'client1-end',
      'client2-start',
      'client2-end'
    ]);
  });
});