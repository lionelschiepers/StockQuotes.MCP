import type { StockQuotesService } from '../stockQuotesService.js';
import type { ServerConfig } from '../types.js';
import { HttpTransportStrategy } from './HttpTransportStrategy.js';
import { StdioTransportStrategy } from './StdioTransportStrategy.js';
import type { TransportStrategy } from './TransportStrategy.js';

/**
 * Transport Factory
 * Creates appropriate transport strategy based on configuration
 */
export class TransportFactory {
  /**
   * Create a transport strategy based on configuration
   * @param config - Server configuration
   * @param stockService - Stock quotes service instance
   */
  static createTransport(
    config: ServerConfig,
    stockService: StockQuotesService
  ): TransportStrategy {
    switch (config.transport) {
      case 'stdio':
        return new StdioTransportStrategy(config.name, config.version, stockService);
      case 'http':
        return new HttpTransportStrategy(
          config.name,
          config.version,
          stockService,
          config.httpPort ?? 3000,
          config.httpHost ?? '0.0.0.0'
        );
      default:
        throw new Error(`Unsupported transport type: ${config.transport as string}`);
    }
  }
}
