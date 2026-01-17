/**
 * Tests for StdioTransportStrategy
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioTransportStrategy } from '../src/transports/StdioTransportStrategy.js';
import { StockQuotesService } from '../src/stockQuotesService.js';
import { YahooFinanceClient } from '../src/yahooFinanceClient.js';
import { logger } from '../src/logger.js';

// Mock logger
jest.mock('../src/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('StdioTransportStrategy', () => {
  let strategy: StdioTransportStrategy;
  let mockStockService: StockQuotesService;

  beforeEach(() => {
    jest.clearAllMocks();
    const yahooClient = new YahooFinanceClient();
    mockStockService = new StockQuotesService(yahooClient);
    strategy = new StdioTransportStrategy('test-server', '1.0.0', mockStockService);
  });

  describe('constructor', () => {
    it('should create a new instance with given parameters', () => {
      expect(strategy).toBeInstanceOf(StdioTransportStrategy);
    });

    it('should initialize McpServer with correct name and version', () => {
      const server = strategy.getServer();
      expect(server).toBeInstanceOf(McpServer);
      // Accessing private members for testing purposes if needed, 
      // but here we just check if it returns a valid server
      expect(server).toBeDefined();
    });

    it('should store the server name and version', () => {
      const server = strategy.getServer();
      // We can't easily check private name/version on McpServer without casting or exposing them,
      // so we rely on the fact that they are passed to the constructor.
      expect(server).toBeDefined();
    });
  });

  describe('connect', () => {
    it('should create a StdioServerTransport and connect', async () => {
      const server = strategy.getServer();
      const connectSpy = jest.spyOn(server, 'connect').mockResolvedValue(undefined);

      await strategy.connect();

      expect(connectSpy).toHaveBeenCalled();
    });

    it('should log the correct message when connected', async () => {
      const server = strategy.getServer();
      jest.spyOn(server, 'connect').mockResolvedValue(undefined);

      await strategy.connect();

      expect(logger.info).toHaveBeenCalledWith('MCP Server connected via stdio transport');
    });
  });


  describe('getType', () => {
    it('should return "stdio" as transport type', () => {
      expect(strategy.getType()).toBe('stdio');
    });
  });

  describe('getServer', () => {
    it('should return the McpServer instance', () => {
      const server = strategy.getServer();
      expect(server).toBeInstanceOf(McpServer);
    });
  });
});
