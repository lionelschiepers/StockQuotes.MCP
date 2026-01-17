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
import { logger } from './logger.js';
import type { TransportType } from './types.js';

// Parse command line arguments
function parseArgs(): { transport: TransportType; httpPort?: number; httpHost?: string } {
  const args = process.argv.slice(2);
  const result = {
    transport: 'stdio' as TransportType,
    httpPort: 3000,
    httpHost: '0.0.0.0',
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
            logger.error(`Invalid transport: ${transport}`);
            process.exit(1);
          }
        }
        break;

      case '--http-port':
      case '--httpPort':
        if (i + 1 < args.length) {
          result.httpPort = Number.parseInt(args[++i], 10);
          if (Number.isNaN(result.httpPort) || result.httpPort <= 0 || result.httpPort > 65535) {
            logger.error('Invalid HTTP port. Port must be between 1 and 65535');
            process.exit(1);
          }
        }
        break;

      case '--http-host':
      case '--httpHost':
        if (i + 1 < args.length) {
          result.httpHost = args[++i];
        }
        break;

      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;

      case '--version':
      case '-v':
        console.log('StockQuotes.MCP version 1.0.4');
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

  --http-host <host>
    Specify the HTTP host to bind to (default: 0.0.0.0)

  --help, -h
    Show this help message

  --version, -v
    Show version information

Examples:
  # Start with stdio transport (for CLI tools)
  node dist/index.js --transport stdio

  # Start with HTTP transport on port 8080
  node dist/index.js --transport http --http-port 8080

  # Start with HTTP transport on localhost
  node dist/index.js --transport http --http-host localhost

For more information, visit: https://github.com/lionelschiepers/StockQuotes.MCP
`);
}

/**
 * Main function to start the server
 */
async function main(): Promise<void> {
  logger.info('MCP Stock Quotes Server starting');

  const args = parseArgs();

  logger.info(`Starting server with ${args.transport} transport...`, {
    transport: args.transport,
    port: args.httpPort,
    host: args.httpHost,
  });

  try {
    await createServer({
      name: 'stock-quotes-server',
      version: '1.0.4',
      transport: args.transport,
      httpPort: args.httpPort,
      httpHost: args.httpHost,
    });

    logger.info('Server started successfully');

    if (args.transport === 'http') {
      await new Promise(() => {});
    }
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down server...');
  process.exit(0);
});

// Start the server
main().catch((error: unknown) => {
  logger.error('Unhandled error', { error });
  process.exit(1);
});
