# 📈 MCP Stock Quotes Server

[![CI](https://github.com/lionelschiepers/StockQuotes.MCP/actions/workflows/build.yml/badge.svg)](https://github.com/lionelschiepers/StockQuotes.MCP/actions/workflows/build.yml)
[![Code Coverage](https://codecov.io/github/lionelschiepers/StockQuotes.MCP/graph/badge.svg?token=GSD4M589HB)](https://codecov.io/github/lionelschiepers/StockQuotes.MCP)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=lionelschiepers_StockQuotes.MCP&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=lionelschiepers_StockQuotes.MCP)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.0+-green.svg)](https://nodejs.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Compatible-green)](https://modelcontextprotocol.io/)

**Empower your AI assistants with real-time financial market data.**

This **Model Context Protocol (MCP)** server seamlessly bridges the gap between LLMs (like Claude, Gemini, etc.) and Yahoo Finance, enabling intelligent agents to access, analyze, and discuss live stock market trends, historical data, and financial metrics.

---

## 📖 Table of Contents

- [Why Use This?](#-why-use-this)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [Available MCP Tools](#-available-mcp-tools)
- [Example Interaction](#-example-interaction)
- [Integration Guide](#-integration-with-ai-platforms)
  - [Cline](#cline)
  - [Claude Code](#claude-code)
  - [Gemini CLI](#gemini-cli)
- [Docker Support](#-docker-usage)
- [Development](#-development)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## 💡 Why Use This?

AI models are powerful, but they often lack real-time knowledge. By connecting them to this MCP server, you unlock their ability to:

- **Analyze Market Trends**: "Compare the P/E ratio of Apple vs. Microsoft."
- **Track Portfolios**: "What is the current value of 10 shares of NVDA?"
- **Research Companies**: "Get me the latest market cap and 52-week range for Tesla."
- **Contextualize News**: "How did the latest earnings report affect Google's stock price today?"

It transforms your AI from a static text generator into a dynamic financial analyst.

## 🚀 Features

- **Real-time Data**: Instant access to prices, volume, market cap, and more via Yahoo Finance.
- **Smart Caching**: Built-in caching (5min for quotes, 30min for search) to optimize performance and reduce API limits.
- **Dual Transport**: Supports `stdio` (for local CLIs) and `HTTP/SSE` (for remote/web clients).
- **Secure & Robust**: HTTP transport includes `helmet` security headers and rate limiting (100 req/15min).
- **Smart Search**: Fuzzy search for stocks by company name or ticker symbol.
- **Multi-Asset Support**: Works with Stocks, ETFs, Cryptocurrencies, and Indices.
- **Type-Safe**: Built with 100% TypeScript for reliability.
- **Production Ready**: Includes Docker support, structured JSON logging (Winston), CI/CD pipelines, and comprehensive testing.
- **Health Monitoring**: Built-in health check endpoint for monitoring server status.
- **Flexible Field Selection**: Optional field filtering for stock quotes to reduce response size.

## ⚡ Quick Start

The fastest way to run the server is using `npx`:

```bash
# Start in Stdio Mode (default for most MCP clients)
npx stockquotes-mcp --transport stdio

# Start as an HTTP/SSE Server
npx stockquotes-mcp --transport http
```

Alternatively, for local development:

```bash
# Clone and Install
git clone https://github.com/lionelschiepers/StockQuotes.MCP.git
cd StockQuotes.MCP
npm install

# Build and Start
npm run build
npm run start:stdio
```

## 🛠 Installation

### Prerequisites

- Node.js 24.0.0 or higher
- npm 9.0.0 or higher

### Step-by-Step

1.  **Clone the repository**

    ```bash
    git clone https://github.com/lionelschiepers/StockQuotes.MCP.git
    cd StockQuotes.MCP
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Build the project**
    ```bash
    npm run build
    ```

## 🚦 Usage

### Command Line Options

| Command               | Description                                                           |
| :-------------------- | :-------------------------------------------------------------------- |
| `npm run start:stdio` | Starts server with Standard I/O transport (Best for local AI agents). |
| `npm run start:http`  | Starts server with HTTP transport on port 3000.                       |
| `npm run dev`         | Runs in development mode with hot-reloading.                          |

### Available MCP Tools

Your AI agent will have access to the following tools:

#### 1. `get_stock_quote`

Fetches detailed financial data for a specific ticker.

- **Parameters:**
  - `ticker` (required): Stock ticker symbol (e.g., AAPL, GOOGL, MSFT)
  - `fields` (optional): Array of specific fields to return (e.g., `["regularMarketPrice", "marketCap"]`)
- **Example Prompt:** "What is the price of AAPL?"
- **Returns:** Price, Currency, Market Cap, Exchange, P/E ratio, 52-week range, and other key metrics.

#### 2. `search_stocks`

Finds ticker symbols based on company names.

- **Parameters:**
  - `query` (required): Search query (company name or ticker)
- **Example Prompt:** "Find the ticker for 'Hims & Hers'."
- **Returns:** List of matching symbols, names, and exchanges.

#### 3. `get_historical_data`

Fetches historical stock data for a specific date range.

- **Parameters:**
  - `ticker` (required): Stock ticker symbol (e.g., AAPL)
  - `fromDate` (required): Start date in YYYY-MM-DD format
  - `toDate` (required): End date in YYYY-MM-DD format
- **Constraints:** Date range cannot exceed 5 years
- **Example Prompt:** "Get AAPL historical data from 2024-01-01 to 2024-01-31."
- **Returns:** Array of daily data including date, close, high, low, and volume.

## 💬 Example Interaction

Here is a real-world example of how an AI assistant (like Gemini) uses this MCP server to perform data analysis:

**User Prompt:**

> "Using stock-quotes: Calculate the average price of AAPL for the last 200, 50 and 20 days. Output is {[{days, average}]}. Keep only 2 decimals for the numbers."

**AI Response:**

```json
[
  {
    "days": 200,
    "average": 233.12
  },
  {
    "days": 50,
    "average": 272.62
  },
  {
    "days": 20,
    "average": 270.57
  }
]
```

![Example Interaction](README.sample1.png)

## 🤖 Integration with AI Platforms

### Cline

To use with [Cline](https://github.com/cline/cline), add this to your MCP settings file:

```json
{
  "mcpServers": {
    "stock-quotes": {
      "command": "npx",
      "args": ["-y", "stockquotes-mcp", "--transport", "stdio"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Claude Code

Integrate with [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code):

**Method 1: CLI**
Run the following command and follow the prompts:

Linux
```bash
claude mcp add --transport stdio stockquotes-mcp -- npx -y stockquotes-mcp --transport stdio
```

Windows
```bash
claude mcp add --transport stdio stockquotes-mcp -- cmd /c npx -y stockquotes-mcp --transport stdio
```

**Method 2: Manual Configuration**
Edit your global Claude settings (usually `~/.claude.json` or `~/.claude/settings.json`):

Linux
```json
{
  "mcpServers": {
    "stock-quotes": {
      "command": "npx",
      "args": ["-y", "stockquotes-mcp", "--transport", "stdio"]
    }
  }
}
```

Windows
```json
{
  "mcpServers": {
    "stock-quotes": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "stockquotes-mcp", "--transport", "stdio"]
    }
  }
}
```

### Gemini CLI

Integrate with the Gemini CLI tool:

**Method 1: Direct Command**

```bash
gemini mcp add stock-quotes npx "-y stockquotes-mcp --transport stdio"
```

**Method 2: Settings Configuration**
Edit your `~/.gemini/settings.json`:

```json
// CLI
{
  "mcpServers": {
    "stock-quotes": {
      "command": "npx",
      "args": ["-y", "stockquotes-mcp", "--transport", "stdio"]
    }
  }
}
```

```json
// HTTP
{
  "mcpServers": {
    "stock-quotes": {
      "httpUrl": "http://servername:port/mcp",
      "headers": {
        "Accept": "application/json, text/event-stream"
      }
    }
  }
}
```

## 🐳 Docker Usage

Run the server in an isolated container.

**Build:**

```bash
docker build -t stockquotes-mcp:latest .
```

**Run (HTTP Mode):**

```bash
docker run -p 3000:3000 stockquotes-mcp:latest
```

**Health Check:**

The Docker container includes a health check endpoint at `/health` that runs every 30 seconds.

## 💻 Development

### Project Structure

```
StockQuotes.MCP/
├── src/                          # Source code
│   ├── index.ts                  # Main entry point
│   ├── server.ts                 # MCP server implementation
│   ├── stockQuotesService.ts     # Business logic for stock data
│   ├── yahooFinanceClient.ts     # Yahoo Finance API client
│   ├── toolRegistration.ts      # MCP tool registration
│   ├── types.ts                  # TypeScript types and Zod schemas
│   ├── logger.ts                 # Winston logger configuration
│   ├── errors.ts                 # Custom error classes
│   └── transports/               # Transport strategies
│       ├── TransportStrategy.ts  # Transport interface
│       ├── StdioTransportStrategy.ts
│       ├── HttpTransportStrategy.ts
│       └── TransportFactory.ts
├── tests/                        # Jest tests
├── .github/                      # CI/CD Workflows
├── docs/                         # Documentation
└── dist/                         # Compiled JavaScript (generated)
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run build:watch` | Compile in watch mode |
| `npm run start` | Start the server (requires transport flag) |
| `npm run start:stdio` | Start with stdio transport |
| `npm run start:http` | Start with HTTP transport on port 3000 |
| `npm run dev` | Run in development mode with hot-reloading |
| `npm run inspect` | Run with MCP inspector for debugging |
| `npm test` | Run all tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run check` | Run both lint and format checks |
| `npm run fix` | Fix both lint and format issues |
| `npm run clean` | Remove the dist directory |

### Quality Checks

- **Test:** `npm test` (Jest with 50% coverage threshold)
- **Lint:** `npm run lint` (ESLint with TypeScript support)
- **Format:** `npm run format` (Prettier)

## 📚 API Reference

### HTTP Endpoints

When running in HTTP mode, the server exposes the following endpoints:

#### POST `/mcp`

Main MCP endpoint for tool invocations using the Streamable HTTP transport.

**Request Body:** JSON-RPC 2.0 formatted requests

**Response:** JSON-RPC 2.0 formatted responses

#### GET `/health`

Health check endpoint for monitoring server status.

**Response:**
```json
{
  "status": "healthy",
  "name": "stock-quotes-server",
  "version": "1.0.0"
}
```

### Command Line Arguments

| Argument | Short | Description | Default |
|----------|-------|-------------|---------|
| `--transport` | `-t` | Transport type (stdio or http) | `stdio` |
| `--http-port` | | HTTP port for HTTP transport | `3000` |
| `--http-host` | | HTTP host to bind to | `0.0.0.0` |
| `--help` | `-h` | Show help message | - |
| `--version` | `-v` | Show version information | - |

### Error Handling

The server uses custom error types for better error handling:

- **NotFoundError**: Thrown when a stock ticker is not found
- **RateLimitError**: Thrown when API rate limits are exceeded
- **ValidationError**: Thrown when input validation fails (e.g., invalid date format)

## 🔧 Troubleshooting

### Common Issues

**Issue:** "Port 3000 is already in use"

**Solution:** Either stop the process using port 3000 or specify a different port:
```bash
npm run start:http -- --http-port 8080
```

**Issue:** "Stock ticker not found"

**Solution:** Verify the ticker symbol is correct and try using the `search_stocks` tool to find the correct symbol.

**Issue:** "Date range cannot exceed 5 years"

**Solution:** The `get_historical_data` tool has a 5-year limit. Break your request into smaller date ranges.

**Issue:** Rate limiting errors

**Solution:** The server caches responses for 5 minutes (quotes) and 30 minutes (search). Wait for the cache to expire or use different tickers.

### Debugging

Use the MCP inspector to debug tool interactions:

```bash
npm run inspect
```

This will start the server with the MCP inspector UI, allowing you to test tools and inspect requests/responses.

### Logs

The server uses Winston for structured JSON logging. Logs are output to the console with the following levels:
- `error`: Critical errors that prevent normal operation
- `warn`: Warning messages for potential issues
- `info`: General informational messages
- `debug`: Detailed debugging information

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Yahoo Finance2](https://github.com/gadicc/yahoo-finance2) API wrapper.
- [Model Context Protocol](https://modelcontextprotocol.io/) standard.

---

_Disclaimer: This tool is for educational purposes. Data provided by Yahoo Finance may be delayed. Validate all financial data before making investment decisions._
