import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { logger } from '../logger.js';
import type { StockQuotesService } from '../stockQuotesService.js';
import { registerToolsOnServer } from '../toolRegistration.js';
import type { TransportStrategy } from './TransportStrategy.js';

/**
 * HTTP Transport Strategy
 * Handles connection via HTTP transport
 */
export class HttpTransportStrategy implements TransportStrategy {
  private readonly server: McpServer;
  private readonly stockService: StockQuotesService;
  private readonly serverName: string;
  private readonly serverVersion: string;
  private expressApp?: express.Application;
  private readonly httpPort: number;
  private readonly httpHost: string;
  private httpServer?: ReturnType<express.Application['listen']>;

  /**
   * Create a new HttpTransportStrategy instance
   * @param serverName - Name of the server
   * @param serverVersion - Version of the server
   * @param stockService - Stock quotes service instance
   * @param httpPort - HTTP port to listen on
   * @param httpHost - HTTP host to bind to (default: '0.0.0.0')
   */
  constructor(
    serverName: string,
    serverVersion: string,
    stockService: StockQuotesService,
    httpPort: number,
    httpHost: string = '0.0.0.0'
  ) {
    this.serverName = serverName;
    this.serverVersion = serverVersion;
    this.stockService = stockService;
    this.httpPort = httpPort;
    this.httpHost = httpHost;
    this.server = new McpServer({
      name: serverName,
      version: serverVersion,
    });
    registerToolsOnServer(this.server, this.stockService);
  }

  /**
   * Connect using HTTP transport
   */
  async connect(): Promise<void> {
    this.setupExpressRoutes();

    return new Promise<void>((resolve, reject) => {
      this.httpServer = this.expressApp?.listen(this.httpPort);

      if (!this.httpServer) {
        reject(new Error('Failed to create HTTP server'));
        return;
      }

      this.httpServer.on('listening', () => {
        logger.info(`MCP Server running on http://localhost:${this.httpPort}/mcp`);
        resolve();
      });

      this.httpServer.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${this.httpPort} is already in use`, { port: this.httpPort });
        } else {
          logger.error(`Error starting HTTP server: ${error.message}`, { error });
        }
        reject(new Error(`Failed to start HTTP server: ${error.message}`));
      });
    });
  }

  /**
   * Setup Express routes for stateless Streamable HTTP transport
   */
  private setupExpressRoutes(): void {
    // Initialize expressApp if not already initialized
    this.expressApp ??= createMcpExpressApp({ host: this.httpHost });

    // Security headers
    this.expressApp.use(helmet());

    // Apply rate limiting to all routes
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Too many requests, please try again later.',
        },
        id: null,
      },
    });

    this.expressApp.use(limiter);

    // Main MCP endpoint for stateless Streamable HTTP
    this.expressApp.post('/mcp', async (req, res) => {
      try {
        // Create stateless transport (no session tracking)
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined, // Stateless - no session tracking
        });

        // Connect server to transport
        await this.server.connect(transport);

        // Handle the request
        await transport.handleRequest(req, res, req.body);

        // Clean up when request is closed
        res.on('close', async () => {
          await transport.close();
        });
      } catch (error) {
        logger.error('Error handling MCP request', { error });
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          });
        }
      }
    });

    // Health check endpoint
    this.expressApp.get('/health', (req, res) => {
      res.json({ status: 'healthy', name: this.serverName, version: this.serverVersion });
    });

    // Disallow GET and DELETE methods on /mcp endpoint
    this.expressApp.get('/mcp', (req, res) => {
      res.status(405).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.',
        },
        id: null,
      });
    });

    this.expressApp.delete('/mcp', (req, res) => {
      res.status(405).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.',
        },
        id: null,
      });
    });
  }

  /**
   * Get the transport type
   */
  getType(): string {
    return 'http';
  }

  /**
   * Get the server instance for tool registration
   */
  getServer(): McpServer {
    return this.server;
  }

  /**
   * Get the Express app instance (for testing or custom transport setups)
   */
  getApp(): express.Application {
    if (!this.expressApp) {
      this.setupExpressRoutes();
    }
    return this.expressApp!;
  }

  /**
   * Close the server and cleanup resources
   */
  async close(): Promise<void> {
    await this.server.close();
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => {
          resolve();
        });
      });
    }
  }
}
