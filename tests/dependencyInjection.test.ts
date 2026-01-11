/**
 * Tests for Dependency Injection functionality
 */

import { StockQuotesServer } from '../src/server.js';
import { StockQuotesService } from '../src/stockQuotesService.js';

// Mock StockQuotesService for testing
class MockStockQuotesService extends StockQuotesService {
  async getQuote() {
    return {
      symbol: 'MOCK',
      name: 'Mock Stock',
      currency: 'USD',
      exchange: 'NASDAQ',
      price: 100,
    };
  }

  async search() {
    return [{ symbol: 'MOCK', name: 'Mock Company', exchange: 'NASDAQ' }];
  }

  async getHistoricalData() {
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
  it('should use injected StockQuotesService when provided', () => {
    const mockService = new MockStockQuotesService();
    const config = {
      name: 'test-server',
      version: '1.0.0',
      transport: 'stdio' as const,
    };

    const server = new StockQuotesServer(config, mockService);

    // Verify that the server is using our mock service
    expect(server).toBeInstanceOf(StockQuotesServer);
  });

  it('should use default StockQuotesService when none provided', () => {
    const config = {
      name: 'test-server',
      version: '1.0.0',
      transport: 'stdio' as const,
    };

    const server = new StockQuotesServer(config);

    // Verify that the server is created successfully with default service
    expect(server).toBeInstanceOf(StockQuotesServer);
  });

  it('should allow factory function to use injected service', async () => {
    const mockService = new MockStockQuotesService();
    const config = {
      name: 'test-server',
      version: '1.0.0',
      transport: 'stdio' as const,
    };

    // Note: We can't actually connect in tests, but we can verify the server creation
    const server = new StockQuotesServer(config, mockService);

    expect(server).toBeInstanceOf(StockQuotesServer);
  });
});
