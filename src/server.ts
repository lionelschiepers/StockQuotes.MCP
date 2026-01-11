import type { StockQuotesService } from './stockQuotesService.js';
import { StockQuotesService as StockQuotesServiceImpl } from './stockQuotesService.js';
import { registerToolsOnServer } from './toolRegistration.js';
import { TransportFactory } from './transports/TransportFactory.js';
import type { TransportStrategy } from './transports/TransportStrategy.js';
import type { ServerConfig } from './types.js';
import { YahooFinanceClient } from './yahooFinanceClient.js';

/**
 * MCP Server for Stock Quotes using Yahoo Finance
 */
export class StockQuotesServer {
  private config: ServerConfig;
  private stockService: StockQuotesService;
  private transportStrategy: TransportStrategy;

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
    // Register tools on the transport's server instance
    const server = this.transportStrategy.getServer();
    registerToolsOnServer(server, this.stockService);

    // Connect using the transport strategy
    await this.transportStrategy.connect();
  }

  /**
   * Get the Express app instance (for testing or custom transport setups)
   * Only available for HTTP transport
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getApp(): any {
    // Check if the transport strategy has getApp method (HTTP transport)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const strategy = this.transportStrategy as unknown as { getApp?: () => any };
    if (typeof strategy.getApp === 'function') {
      return strategy.getApp();
    }
    throw new Error('Express app is only available for HTTP transport');
  }
}

/**
 * Factory function to create and start the server
 */
export async function createServer(
  config?: Partial<ServerConfig>
): Promise<StockQuotesServer> {
  const serverConfig: ServerConfig = {
    name: 'stock-quotes-server',
    version: '1.0.0',
    transport: 'stdio',
    httpPort: 3000,
    ...config,
  };

  const yahooClient = new YahooFinanceClient();
  const stockService = new StockQuotesServiceImpl(yahooClient);
  const server = new StockQuotesServer(serverConfig, stockService);
  await server.connect();
  return server;
}
