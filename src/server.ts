import type { StockQuotesService } from './stockQuotesService.js';
import { StockQuotesService as StockQuotesServiceImpl } from './stockQuotesService.js';
import { registerToolsOnServer } from './toolRegistration.js';
import { TransportFactory } from './transports/TransportFactory.js';
import type { TransportStrategy } from './transports/TransportStrategy.js';
import type { ServerConfig } from './types.js';
import { YahooFinanceClient } from './yahooFinanceClient.js';

type HttpTransportStrategy = TransportStrategy & {
  getApp(): unknown;
};

/**
 * MCP Server for Stock Quotes using Yahoo Finance
 */
export class StockQuotesServer {
  private readonly config: ServerConfig;
  private readonly stockService: StockQuotesService;
  private readonly transportStrategy: TransportStrategy;

  /**
   * Create a new instance of the StockQuotesServer
   * @param config - Server configuration
   * @param stockService - Stock quotes service (dependency injected)
   */
  constructor(config: ServerConfig, stockService: StockQuotesService) {
    this.config = config;
    this.stockService = stockService;
    this.transportStrategy = TransportFactory.createTransport(config, this.stockService);
  }

  /**
   * Connect to the appropriate transport using the strategy pattern
   */
  async connect(): Promise<void> {
    const server = this.transportStrategy.getServer();
    registerToolsOnServer(server, this.stockService);
    await this.transportStrategy.connect();
  }

  /**
   * Get the Express app instance (for testing or custom transport setups)
   * Only available for HTTP transport
   */
  getApp(): unknown {
    const strategy = this.transportStrategy as HttpTransportStrategy;
    if (typeof strategy.getApp === 'function') {
      return strategy.getApp();
    }
    throw new Error('Express app is only available for HTTP transport');
  }

  /**
   * Close the server and cleanup resources
   */
  async close(): Promise<void> {
    await this.transportStrategy.close();
  }
}

/**
 * Factory function to create and start the server
 */
export async function createServer(config?: Partial<ServerConfig>): Promise<StockQuotesServer> {
  const serverConfig: ServerConfig = {
    name: 'stock-quotes-server',
    version: '1.0.0',
    transport: 'stdio',
    httpPort: 3000,
    httpHost: '0.0.0.0',
    ...config,
  };

  const yahooClient = new YahooFinanceClient();
  const stockService = new StockQuotesServiceImpl(yahooClient);
  const server = new StockQuotesServer(serverConfig, stockService);
  await server.connect();
  return server;
}
