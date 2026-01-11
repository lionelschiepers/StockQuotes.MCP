import { StockQuotesServer } from '../src/server.js';
import { stockQuotesService } from '../src/stockQuotesService.js';
import { HttpTransportStrategy } from '../src/transports/HttpTransportStrategy.js';
import { StdioTransportStrategy } from '../src/transports/StdioTransportStrategy.js';
import { TransportFactory } from '../src/transports/TransportFactory.js';

describe('StockQuotesServer Refactoring', () => {
  describe('Transport Strategy Pattern', () => {
    it('should create stdio transport strategy', () => {
      const config = {
        name: 'test-server',
        version: '1.0.0',
        transport: 'stdio' as const,
        httpPort: 3000,
      };

      const strategy = TransportFactory.createTransport(config, stockQuotesService);
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

      const strategy = TransportFactory.createTransport(config, stockQuotesService);
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
        TransportFactory.createTransport(config, stockQuotesService);
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

      const server = new StockQuotesServer(config);
      expect(server).toBeInstanceOf(StockQuotesServer);
    });

    it('should create server with http transport', () => {
      const config = {
        name: 'test-server',
        version: '1.0.0',
        transport: 'http' as const,
        httpPort: 3000,
      };

      const server = new StockQuotesServer(config);
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

      const server = new StockQuotesServer(config);
      expect(typeof server.connect).toBe('function');
    });

    it('should have getApp method', () => {
      const config = {
        name: 'test-server',
        version: '1.0.0',
        transport: 'http' as const,
        httpPort: 3000,
      };

      const server = new StockQuotesServer(config);
      expect(typeof server.getApp).toBe('function');
    });
  });
});
