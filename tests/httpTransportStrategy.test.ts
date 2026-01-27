/**
 * Tests for HttpTransportStrategy
 */

import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import supertest from 'supertest';
import { HttpTransportStrategy } from '../src/transports/HttpTransportStrategy.js';
import { logger } from '../src/logger.js';

jest.mock('@modelcontextprotocol/sdk/server/express.js');
jest.mock('@modelcontextprotocol/sdk/server/mcp.js');
jest.mock('@modelcontextprotocol/sdk/server/streamableHttp.js');

// Mock logger
jest.mock('../src/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

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
      const listenMock = jest.fn().mockImplementation((_port) => {
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
      let listeningCallback: (() => void) | null = null;
      const listenMock = jest.fn().mockImplementation((_port) => {
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

      expect(logger.info).toHaveBeenCalledWith('MCP Server running on http://localhost:3000/mcp');
    });

    it('should reject if http server fails to start', async () => {
      const listenMock = jest.fn().mockReturnValue(undefined);
      mockExpressApp.listen = listenMock;
      createStrategy();

      await expect(strategy.connect()).rejects.toThrow('Failed to create HTTP server');
    });

    it('should handle EADDRINUSE error', async () => {
      let errorCallback: ((error: any) => void) | null = null;

      const listenMock = jest.fn().mockImplementation((_port) => {
        setTimeout(() => {
          if (errorCallback) {
            const error: any = new Error('Address in use');
            error.code = 'EADDRINUSE';
            errorCallback(error);
          }
        }, 0);
        return {
          on: jest.fn().mockImplementation((event: string, callback: any) => {
            if (event === 'error') {
              errorCallback = callback;
            }
          }),
        };
      });
      mockExpressApp.listen = listenMock;
      createStrategy();

      await expect(strategy.connect()).rejects.toThrow(
        'Failed to start HTTP server: Address in use'
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Port 3000 is already in use',
        expect.objectContaining({ port: 3000 })
      );
    });

    it('should handle generic server errors', async () => {
      let errorCallback: ((error: any) => void) | null = null;

      const listenMock = jest.fn().mockImplementation((_port) => {
        setTimeout(() => {
          if (errorCallback) {
            const error = new Error('Generic error');
            errorCallback(error);
          }
        }, 0);
        return {
          on: jest.fn().mockImplementation((event: string, callback: any) => {
            if (event === 'error') {
              errorCallback = callback;
            }
          }),
        };
      });
      mockExpressApp.listen = listenMock;
      createStrategy();

      await expect(strategy.connect()).rejects.toThrow('Failed to start HTTP server: Generic error');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error starting HTTP server: Generic error'),
        expect.objectContaining({ error: expect.any(Error) })
      );
    });
  });

  describe('setupExpressRoutes', () => {
    let app: any;

    beforeEach(() => {
      const listenMock = jest.fn().mockImplementation((_port, callback) => {
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
      mockStreamableTransport.handleRequest.mockImplementation((_req: any, res: any, _body: any) => {
        res.status(200).json({ result: 'success' });
      });

      const response = await app.post('/mcp').send({ method: 'test' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ result: 'success' });
    });

    it('should return 500 error on exception during request handling', async () => {
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
    });

    it('should log error when request handling fails', async () => {
      mockStreamableTransport.handleRequest.mockImplementation(() => {
        throw new Error('Test error');
      });

      await app.post('/mcp').send({ method: 'test' });

      expect(logger.error).toHaveBeenCalledWith('Error handling MCP request', expect.objectContaining({ error: expect.any(Error) }));
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
