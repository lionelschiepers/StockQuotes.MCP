/**
 * Tests for StdioTransportStrategy
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StdioTransportStrategy } from '../src/transports/StdioTransportStrategy.js';

jest.mock('@modelcontextprotocol/sdk/server/mcp.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');

describe('StdioTransportStrategy', () => {
  let mockStockService: any;
  let mockMcpServer: any;
  let mockStdioTransport: any;
  let strategy: StdioTransportStrategy;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStockService = {
      getQuote: jest.fn(),
      search: jest.fn(),
      getHistoricalData: jest.fn(),
    };

    mockMcpServer = {
      connect: jest.fn(),
      close: jest.fn(),
    };
    mockStdioTransport = {
      connect: jest.fn(),
      close: jest.fn(),
    };

    (McpServer as jest.Mock).mockImplementation(() => mockMcpServer);
    (StdioServerTransport as jest.Mock).mockImplementation(() => mockStdioTransport);

    strategy = new StdioTransportStrategy('test-server', '1.0.0', mockStockService);
  });

  describe('constructor', () => {
    it('should create a new instance with given parameters', () => {
      expect(strategy).toBeInstanceOf(StdioTransportStrategy);
    });

    it('should initialize McpServer with correct name and version', () => {
      expect(McpServer).toHaveBeenCalledWith({
        name: 'test-server',
        version: '1.0.0',
      });
    });

    it('should store the server name and version', () => {
      const server = strategy.getServer();
      expect(server).toBe(mockMcpServer);
    });
  });

  describe('connect', () => {
    it('should create a StdioServerTransport and connect', async () => {
      await strategy.connect();

      expect(StdioServerTransport).toHaveBeenCalled();
      expect(mockMcpServer.connect).toHaveBeenCalledWith(mockStdioTransport);
    });

    it('should log the correct message when connected', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await strategy.connect();

      expect(consoleSpy).toHaveBeenCalledWith('MCP Server connected via stdio transport');
      consoleSpy.mockRestore();
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
      expect(server).toBe(mockMcpServer);
    });
  });
});
