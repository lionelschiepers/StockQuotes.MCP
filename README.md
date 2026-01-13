# 📈 MCP Stock Quotes Server

[![CI](https://github.com/lionelschiepers/StockQuotes.MCP/actions/workflows/build.yml/badge.svg)](https://github.com/lionelschiepers/StockQuotes.MCP/actions/workflows/build.yml)
[![Code Coverage](https://codecov.io/github/lionelschiepers/StockQuotes.MCP/graph/badge.svg?token=GSD4M589HB)](https://codecov.io/github/lionelschiepers/StockQuotes.MCP)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
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
- [Available Tools](#-available-mcp-tools)
- [Example Interaction](#-example-interaction)
- [Integration Guide](#-integration-with-ai-platforms)
  - [Cline](#cline)
  - [Gemini CLI](#gemini-cli)
- [Docker Support](#-docker-usage)
- [Development](#-development)
- [License](#-license)

---

## 💡 Why Use This?

AI models are powerful, but they often lack real-time knowledge. By connecting them to this MCP server, you unlock their ability to:

*   **Analyze Market Trends**: "Compare the P/E ratio of Apple vs. Microsoft."
*   **Track Portfolios**: "What is the current value of 10 shares of NVDA?"
*   **Research Companies**: "Get me the latest market cap and 52-week range for Tesla."
*   **Contextualize News**: "How did the latest earnings report affect Google's stock price today?"

It transforms your AI from a static text generator into a dynamic financial analyst.

## 🚀 Features

*   **Real-time Data**: Instant access to prices, volume, market cap, and more via Yahoo Finance.
*   **Dual Transport**: Supports `stdio` (for local CLIs) and `SSE/HTTP` (for remote/web clients).
*   **Smart Search**: Fuzzy search for stocks by company name or ticker symbol.
*   **Multi-Asset Support**: Works with Stocks, ETFs, Cryptocurrencies, and Indices.
*   **Type-Safe**: Built with 100% TypeScript for reliability.
*   **Production Ready**: Includes Docker support, CI/CD pipelines, and comprehensive testing.

## ⚡ Quick Start

For those who want to get up and running immediately:

```bash
# Clone and Install
git clone https://github.com/lionelschiepers/StockQuotes.MCP.git
cd StockQuotes.MCP
npm install

# Build
npm run build

# Start (Stdio Mode - default for most MCP clients)
npm run start:stdio
```

## 🛠 Installation

### Prerequisites

*   Node.js 22.0.0 or higher (LTS)
*   npm 9.0.0 or higher

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

| Command | Description |
| :--- | :--- |
| `npm run start:stdio` | Starts server with Standard I/O transport (Best for local AI agents). |
| `npm run start:http` | Starts server with HTTP transport on port 3000. |
| `npm run dev` | Runs in development mode with hot-reloading. |

### Available MCP Tools

Your AI agent will have access to the following tools:

#### 1. `get_stock_quote`
Fetches detailed financial data for a specific ticker.

*   **Example Prompt:** "What is the price of AAPL?"
*   **Returns:** Price, Currency, Market Cap, Exchange, etc.

#### 2. `search_stocks`
Finds ticker symbols based on company names.

*   **Example Prompt:** "Find the ticker for 'Hims & Hers'."
*   **Returns:** List of matching symbols and names.

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
      "command": "node",
      "args": ["/absolute/path/to/StockQuotes.MCP/dist/index.js", "--transport", "stdio"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Gemini CLI

Integrate with the Gemini CLI tool using one of these methods:

**Method 1: Direct Command**
```bash
gemini mcp add stock-quotes node "C:\Path\To\StockQuotes.MCP\dist\index.js --transport stdio"
```

**Method 2: Settings Configuration**
Edit your `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "stock-quotes": {
      "command": "node",
      "args": [
        "./dist/index.js", 
        "--transport",
        "stdio"
      ]
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

## 💻 Development

### Project Structure
```
StockQuotes.MCP/
├── src/               # Source code
├── tests/             # Jest tests
├── .github/           # CI/CD Workflows
└── ...
```

### Quality Checks
*   **Test:** `npm test`
*   **Lint:** `npm run lint`
*   **Format:** `npm run format`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

*   [Yahoo Finance2](https://github.com/gadicc/yahoo-finance2) API wrapper.
*   [Model Context Protocol](https://modelcontextprotocol.io/) standard.

---

*Disclaimer: This tool is for educational purposes. Data provided by Yahoo Finance may be delayed. Validate all financial data before making investment decisions.*