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

    const result = await client.quote('AAPL', { modules: ['price'] });

    expect(mockYahooInstance.quote).toHaveBeenCalledWith('AAPL', { modules: ['price'] });
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
});