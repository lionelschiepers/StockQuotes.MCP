import { StockQuotesServer } from '../src/server.js';
import { StockQuotesService } from '../src/stockQuotesService.js';
import { HttpTransportStrategy } from '../src/transports/HttpTransportStrategy.js';
import { StdioTransportStrategy } from '../src/transports/StdioTransportStrategy.js';
import { TransportFactory } from '../src/transports/TransportFactory.js';
import type { YahooClient } from '../src/yahooFinanceClient.js';
import type { HistoricalData, StockQuoteResponse, StockSearchResult } from '../src/types.js';

// Create a mock YahooClient
class MockYahooClient implements YahooClient {
  quote = jest.fn();
  search = jest.fn();
  chart = jest.fn();
}

// Create a mock StockQuotesService that implements the interface
class MockStockQuotesService extends StockQuotesService {
  constructor(yahooClient: YahooClient) {
    super(yahooClient);
    this.getQuote = jest.fn();
    this.getMultipleQuotes = jest.fn();
    this.search = jest.fn();
    this.getHistoricalData = jest.fn();
  }

  // Explicitly type the mocked methods
  getQuote: jest.Mock<Promise<StockQuoteResponse>, any>;
  getMultipleQuotes: jest.Mock<Promise<Map<string, StockQuoteResponse>>, any>;
  search: jest.Mock<Promise<StockSearchResult[]>, any>;
  getHistoricalData: jest.Mock<Promise<HistoricalData[]>, any>;
}

describe('StockQuotesServer Refactoring', () => {
  let mockYahooClient: MockYahooClient;
  let mockStockService: MockStockQuotesService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockYahooClient = new MockYahooClient();
    mockStockService = new MockStockQuotesService(mockYahooClient);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('Transport Strategy Pattern', () => {
    it('should create stdio transport strategy', () => {
      const config = {
        name: 'test-server',
        version: '1.0.0',
        transport: 'stdio' as const,
        httpPort: 3000,
      };

      const strategy = TransportFactory.createTransport(config, mockStockService);
      expect(strategy).toBeInstanceOf(StdioTransportStrategy);
      expect(strategy.getType()).toBe('stdio');
    });

    it('should create http transport strategy', () => {
      const config = {
        name: 'test-server',
        version: '1.0.0',
        transport: 'http' as const,
        httpPort: 3000,
      };

      const strategy = TransportFactory.createTransport(config, mockStockService);
      expect(strategy).toBeInstanceOf(HttpTransportStrategy);
      expect(strategy.getType()).toBe('http');
    });

    it('should throw error for unsupported transport type', () => {
      const config = {
        name: 'test-server',
        version: '1.0.0',
        transport: 'websocket' as any,
        httpPort: 3000,
      };

      expect(() => {
        TransportFactory.createTransport(config, mockStockService);
      }).toThrow('Unsupported transport type: websocket');
    });
  });

  describe('Server Initialization', () => {
    it('should create server with stdio transport', () => {
      const config = {
        name: 'test-server',
        version: '1.0.0',
        transport: 'stdio' as const,
        httpPort: 3000,
      };

      const server = new StockQuotesServer(config, mockStockService);
      expect(server).toBeInstanceOf(StockQuotesServer);
    });

    it('should create server with http transport', () => {
      const config = {
        name: 'test-server',
        version: '1.0.0',
        transport: 'http' as const,
        httpPort: 3000,
      };

      const server = new StockQuotesServer(config, mockStockService);
      expect(server).toBeInstanceOf(StockQuotesServer);
    });
  });

  describe('Server Functionality', () => {
    it('should have connect method', () => {
      const config = {
        name: 'test-server',
        version: '1.0.0',
        transport: 'stdio' as const,
        httpPort: 3000,
      };

      const server = new StockQuotesServer(config, mockStockService);
      expect(typeof server.connect).toBe('function');
    });

    it('should have getApp method', () => {
      const config = {
        name: 'test-server',
        version: '1.0.0',
        transport: 'http' as const,
        httpPort: 3000,
      };

      const server = new StockQuotesServer(config, mockStockService);
      expect(typeof server.getApp).toBe('function');
    });
  });

  describe('connect method', () => {
    it('should connect transport when using stdio', async () => {
      const config = {
        name: 'test-server',
        version: '1.0.0',
        transport: 'stdio' as const,
        httpPort: 3000,
      };

      const server = new StockQuotesServer(config, mockStockService);
      const connectSpy = jest.spyOn((server as any).transportStrategy, 'connect');

      await server.connect();

      expect(connectSpy).toHaveBeenCalled();

      await server.close();
    });

    it('should connect transport when using http', async () => {
      const config = {
        name: 'test-server',
        version: '1.0.0',
        transport: 'http' as const,
        httpPort: 3000,
        httpHost: 'localhost',
      };

      const server = new StockQuotesServer(config, mockStockService);
      const connectSpy = jest.spyOn((server as any).transportStrategy, 'connect');

      await server.connect();

      expect(connectSpy).toHaveBeenCalled();

      await server.close();
    });
  });

  describe('getApp method', () => {
    it('should throw error when getApp is called on stdio transport', () => {
      const config = {
        name: 'test-server',
        version: '1.0.0',
        transport: 'stdio' as const,
        httpPort: 3000,
      };

      const server = new StockQuotesServer(config, mockStockService);

      expect(() => server.getApp()).toThrow('Express app is only available for HTTP transport');
    });

    it('should return Express app when getApp is called on http transport', () => {
      const config = {
        name: 'test-server',
        version: '1.0.0',
        transport: 'http' as const,
        httpPort: 3000,
        httpHost: 'localhost',
      };

      const server = new StockQuotesServer(config, mockStockService);
      const mockApp = { express: 'app' };

      jest.spyOn((server as any).transportStrategy, 'getApp').mockReturnValue(mockApp);

      const app = server.getApp();
      expect(app).toBe(mockApp);
    });
  });

  describe('createServer factory function', () => {
    it('should create a server with default config', async () => {
      const { createServer } = await import('../src/server.js');
      const connectSpy = jest.spyOn(StockQuotesServer.prototype, 'connect');

      const server = await createServer();

      expect(server).toBeInstanceOf(StockQuotesServer);
      expect(connectSpy).toHaveBeenCalled();

      await server.close();
    });

    it('should create a server with custom config', async () => {
      const { createServer } = await import('../src/server.js');
      const connectSpy = jest.spyOn(StockQuotesServer.prototype, 'connect');

      const server = await createServer({
        name: 'custom-server',
        version: '2.0.0',
        transport: 'stdio',
        httpPort: 4000,
      });

      expect(server).toBeInstanceOf(StockQuotesServer);
      expect(connectSpy).toHaveBeenCalled();

      await server.close();
    });
  });
});
