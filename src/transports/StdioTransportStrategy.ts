import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from '../logger.js';
import { registerToolsOnServer } from '../toolRegistration.js';
import type { StockQuotesService } from '../stockQuotesService.js';
import type { TransportStrategy } from './TransportStrategy.js';

/**
 * Standard I/O Transport Strategy
 * Handles connection via stdio transport
 */
export class StdioTransportStrategy implements TransportStrategy {
  private readonly server: McpServer;

  /**
   * Create a new StdioTransportStrategy instance
   * @param serverName - Name of the server
   * @param serverVersion - Version of the server
   * @param stockService - Stock quotes service instance
   */
  constructor(serverName: string, serverVersion: string, stockService: StockQuotesService) {
    this.server = new McpServer({
      name: serverName,
      version: serverVersion,
    });
    registerToolsOnServer(this.server, stockService);
  }

  /**
   * Connect using stdio transport
   */
  async connect(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('MCP Server connected via stdio transport');
  }

  /**
   * Get the transport type
   */
  getType(): string {
    return 'stdio';
  }

  /**
   * Get the server instance for tool registration
   */
  getServer(): McpServer {
    return this.server;
  }

  /**
   * Close the server and cleanup resources
   */
  async close(): Promise<void> {
    await this.server.close();
  }
}
