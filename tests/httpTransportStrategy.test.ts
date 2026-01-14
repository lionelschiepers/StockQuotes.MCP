/**
 * Tests for HttpTransportStrategy
 */

import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import supertest from 'supertest';
import { HttpTransportStrategy } from '../src/transports/HttpTransportStrategy.js';

jest.mock('@modelcontextprotocol/sdk/server/express.js');
jest.mock('@modelcontextprotocol/sdk/server/mcp.js');
jest.mock('@modelcontextprotocol/sdk/server/streamableHttp.js');

describe('HttpTransportStrategy', () => {
  let mockStockService: any;
  let mockExpressApp: express.Application;
  let mockMcpServer: any;
  let mockStreamableTransport: any;
  let strategy: HttpTransportStrategy;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStockService = {
      getQuote: jest.fn(),
      search: jest.fn(),
      getHistoricalData: jest.fn(),
    };

    mockExpressApp = express();
    mockMcpServer = {
      connect: jest.fn(),
      close: jest.fn(),
      registerTool: jest.fn(),
    };
    mockStreamableTransport = {
      connect: jest.fn(),
      handleRequest: jest.fn(),
      close: jest.fn(),
    };

    (McpServer as jest.Mock).mockImplementation(() => mockMcpServer);
    (StreamableHTTPServerTransport as jest.Mock).mockImplementation(() => mockStreamableTransport);
    (createMcpExpressApp as jest.Mock).mockReturnValue(mockExpressApp);
  });

  const createStrategy = () => {
    strategy = new HttpTransportStrategy('test-server', '1.0.0', mockStockService, 3000);
    return strategy;
  };

  describe('constructor', () => {
    it('should create a new instance with given parameters', () => {
      createStrategy();
      expect(strategy).toBeInstanceOf(HttpTransportStrategy);
    });

    it('should initialize McpServer with correct name and version', () => {
      jest.clearAllMocks();
      createStrategy();
      expect(McpServer).toHaveBeenCalledWith({
        name: 'test-server',
        version: '1.0.0',
      });
    });
  });

  describe('connect', () => {
    it('should setup routes and start listening', async () => {
      let listeningCallback: (() => void) | null = null;
      const listenMock = jest.fn().mockImplementation((port) => {
        setTimeout(() => {
          if (listeningCallback) {
            listeningCallback();
          }
        }, 0);
        return {
          ...mockExpressApp,
          on: jest.fn().mockImplementation((event: string, callback: () => void) => {
            if (event === 'listening') {
              listeningCallback = callback;
            }
          }),
        };
      });
      mockExpressApp.listen = listenMock;
      createStrategy();

      await strategy.connect();

      expect(listenMock).toHaveBeenCalledWith(3000);
    });

    it('should log the correct message when connected', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      let listeningCallback: (() => void) | null = null;
      const listenMock = jest.fn().mockImplementation((port) => {
        setTimeout(() => {
          if (listeningCallback) {
            listeningCallback();
          }
        }, 0);
        return {
          ...mockExpressApp,
          on: jest.fn().mockImplementation((event: string, callback: () => void) => {
            if (event === 'listening') {
              listeningCallback = callback;
            }
          }),
        };
      });
      mockExpressApp.listen = listenMock;
      createStrategy();

      await strategy.connect();

      expect(consoleSpy).toHaveBeenCalledWith('MCP Server running on http://localhost:3000/mcp');
      consoleSpy.mockRestore();
    });
  });

  describe('setupExpressRoutes', () => {
    let app: any;

    beforeEach(() => {
      const listenMock = jest.fn().mockImplementation((port, callback) => {
        callback();
        return mockExpressApp;
      });
      mockExpressApp.listen = listenMock;
      createStrategy();
      app = supertest(strategy.getApp());
    });

    it('should return status healthy for GET /health', async () => {
      const response = await app.get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'healthy',
        name: 'test-server',
        version: '1.0.0',
      });
    });

    it('should return 405 for GET /mcp', async () => {
      const response = await app.get('/mcp');

      expect(response.status).toBe(405);
      expect(response.body).toEqual({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.',
        },
        id: null,
      });
    });

    it('should return 405 for DELETE /mcp', async () => {
      const response = await app.delete('/mcp');

      expect(response.status).toBe(405);
      expect(response.body).toEqual({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.',
        },
        id: null,
      });
    });

    it('should handle POST /mcp successfully', async () => {
      mockStreamableTransport.handleRequest.mockImplementation((req: any, res: any, body: any) => {
        res.status(200).json({ result: 'success' });
      });

      const response = await app.post('/mcp').send({ method: 'test' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ result: 'success' });
    });

    it('should return 500 error on exception during request handling', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStreamableTransport.handleRequest.mockImplementation(() => {
        throw new Error('Test error');
      });

      const response = await app.post('/mcp').send({ method: 'test' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
      errorSpy.mockRestore();
    });

    it('should log error when request handling fails', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStreamableTransport.handleRequest.mockImplementation(() => {
        throw new Error('Test error');
      });

      await app.post('/mcp').send({ method: 'test' });

      expect(errorSpy).toHaveBeenCalledWith('Error handling MCP request:', expect.any(Error));
      errorSpy.mockRestore();
    });
  });

  describe('getType', () => {
    it('should return "http" as transport type', () => {
      createStrategy();
      expect(strategy.getType()).toBe('http');
    });
  });

  describe('getServer', () => {
    it('should return the McpServer instance', () => {
      createStrategy();
      const server = strategy.getServer();
      expect(server).toBe(mockMcpServer);
    });
  });

  describe('getApp', () => {
    it('should return the Express app instance', () => {
      createStrategy();
      const app = strategy.getApp();
      expect(app).toBe(mockExpressApp);
    });

    it('should setup routes if expressApp is not initialized', () => {
      jest.clearAllMocks();
      createStrategy();
      const app = strategy.getApp();
      expect(app).toBe(mockExpressApp);
    });
  });
});
