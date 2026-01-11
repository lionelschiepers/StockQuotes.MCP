#!/usr/bin/env node

/**
 * Main entry point for the MCP Stock Quotes Server
 *
 * This server provides tools for fetching stock quotes from Yahoo Finance
 * through the Model Context Protocol (MCP).
 *
 * Usage:
 *   node dist/index.js --transport stdio    # Start with stdio transport
 *   node dist/index.js --transport http     # Start with HTTP transport (port 3000)
 */

import { createServer } from './server.js';
import type { TransportType } from './types.js';

// Parse command line arguments
function parseArgs(): { transport: TransportType; httpPort?: number } {
  const args = process.argv.slice(2);
  const result = {
    transport: 'stdio' as TransportType,
    httpPort: 3000,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--transport':
      case '-t':
        if (i + 1 < args.length) {
          const transport = args[++i].toLowerCase() as TransportType;
          if (['stdio', 'http'].includes(transport)) {
            result.transport = transport;
          } else {
            console.error(`Invalid transport: ${transport}`);
            console.error('Valid transports: stdio, http');
            process.exit(1);
          }
        }
        break;

      case '--http-port':
      case '--httpPort':
        if (i + 1 < args.length) {
          result.httpPort = parseInt(args[++i], 10);
          if (isNaN(result.httpPort) || result.httpPort <= 0 || result.httpPort > 65535) {
            console.error('Invalid HTTP port. Port must be between 1 and 65535');
            process.exit(1);
          }
        }
        break;

      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;

      case '--version':
      case '-v':
        console.log('mcp-server-stockquotes version 1.0.0');
        process.exit(0);
    }
  }

  return result;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
MCP Stock Quotes Server

Usage: node dist/index.js [options]

Options:
  --transport, -t <stdio|http>
    Specify the transport type to use (default: stdio)

  --http-port <port>
    Specify the HTTP port for HTTP transport (default: 3000)

  --help, -h
    Show this help message

  --version, -v
    Show version information

Examples:
  # Start with stdio transport (for CLI tools)
  node dist/index.js --transport stdio

  # Start with HTTP transport on port 8080
  node dist/index.js --transport http --http-port 8080

For more information, visit: https://github.com/yourusername/mcp-server-stockquotes
`);
}

/**
 * Main function to start the server
 */
async function main(): Promise<void> {
  console.log('MCP Stock Quotes Server');
  console.log('========================');

  const args = parseArgs();

  console.log(`Starting server with ${args.transport} transport...`);

  try {
    await createServer({
      name: 'stock-quotes-server',
      version: '1.0.0',
      transport: args.transport,
      httpPort: args.httpPort,
    });

    console.log('Server started successfully');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
