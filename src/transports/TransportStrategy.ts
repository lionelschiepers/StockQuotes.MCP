import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Transport Strategy Interface
 * Defines the contract for different transport implementations
 */
export interface TransportStrategy {
  /**
   * Connect the server using the specific transport
   */
  connect(): Promise<void>;

  /**
   * Get the transport type
   */
  getType(): string;

  /**
   * Get the server instance for tool registration
   */
  getServer(): McpServer;

  /**
   * Close the server and cleanup resources
   */
  close(): Promise<void>;
}
