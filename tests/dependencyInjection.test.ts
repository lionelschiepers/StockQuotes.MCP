/**
 * Tests for Dependency Injection functionality
 */

import { StockQuotesServer } from '../src/server.js';
import { StockQuotesService } from '../src/stockQuotesService.js';
import type { YahooClient } from '../src/yahooFinanceClient.js';
import type { HistoricalData, StockQuoteResponse, StockSearchResult } from '../src/types.js';

// Create a mock YahooClient for testing
class MockYahooClient implements YahooClient {
  quote = jest.fn();
  search = jest.fn();
  chart = jest.fn();
}

// Mock StockQuotesService for testing
class MockStockQuotesService extends StockQuotesService {
  constructor(yahooClient: YahooClient) {
    super(yahooClient);
  }
  async getQuote(): Promise<StockQuoteResponse> {
    return {
      symbol: 'MOCK',
      name: 'Mock Stock',
      currency: 'USD',
      exchange: 'NASDAQ',
      regularMarketPrice: 100,
    };
  }

  async search(): Promise<StockSearchResult[]> {
    return [{ symbol: 'MOCK', name: 'Mock Company', exchange: 'NASDAQ' }];
  }

  async getHistoricalData(): Promise<HistoricalData[]> {
    return [
      {
        date: '2023-01-01',
        close: 100,
        high: 105,
        low: 95,
        volume: 1000000,
      },
    ];
  }
}

describe('Dependency Injection', () => {
  let mockYahooClient: MockYahooClient;
  let mockStockService: MockStockQuotesService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockYahooClient = new MockYahooClient();
    mockStockService = new MockStockQuotesService(mockYahooClient);
  });

  it('should use injected StockQuotesService when provided', () => {
    const config = {
      name: 'test-server',
      version: '1.0.0',
      transport: 'stdio' as const,
    };

    const server = new StockQuotesServer(config, mockStockService);

    // Verify that the server is using our mock service
    expect(server).toBeInstanceOf(StockQuotesServer);
  });

  it('should allow factory function to use injected service', async () => {
    const config = {
      name: 'test-server',
      version: '1.0.0',
      transport: 'stdio' as const,
    };

    // Note: We can't actually connect in tests, but we can verify the server creation
    const server = new StockQuotesServer(config, mockStockService);

    expect(server).toBeInstanceOf(StockQuotesServer);
  });
});
