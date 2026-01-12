# MCP Stock Quotes Server

A Model Context Protocol (MCP) server for fetching stock quotes from Yahoo Finance. This server provides AI assistants and tools with access to real-time and historical stock market data through a standardized MCP interface.

## 🚀 Features

- **Multiple Transport Support**: stdio, HTTP for flexible integration
- **Real-time Stock Quotes**: Fetch current prices, volume, market cap, and key metrics
- **Stock Search**: Search for stocks by company name or ticker symbol
- **Comprehensive Data**: Support for stocks, ETFs, cryptocurrencies, and other financial instruments
- **TypeScript**: Full TypeScript support with type safety
- **Well Tested**: Unit tests with Jest and good code coverage
- **Production Ready**: Docker containerization and CI/CD pipeline

## 📁 Project Structure

```
StockQuotes.MCP/
├── .gemini/               # Gemini CLI configuration
├── .github/
│   └── workflows/
│       └── build.yml      # GitHub Actions CI workflow
├── .husky/                # Git hooks configuration
├── prompts/               # AI prompt templates
├── src/
│   ├── transports/        # Transport strategy implementations (stdio, HTTP)
│   ├── index.ts           # Main entry point
│   ├── server.ts          # MCP server implementation
│   ├── stockQuotesService.ts # Service for fetching stock data
│   ├── toolRegistration.ts # MCP tool registration logic
│   ├── types.ts           # TypeScript type definitions
│   └── yahooFinanceClient.ts # Yahoo Finance API client
├── tests/                 # Unit and integration tests
├── .dockerignore          # Docker ignore rules
├── .gitignore             # Git ignore rules
├── build.cmd              # Windows build script
├── Dockerfile             # Docker containerization
├── eslint.config.js       # ESLint flat configuration
├── GEMINI.md              # Project-specific AI context
├── jest.config.js         # Jest testing configuration
├── LICENSE                # Project license
├── package.json           # Project dependencies and scripts
├── prettier.config.js     # Prettier code formatter
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## 🛠️ Installation

### Prerequisites

- Node.js 22.0.0 or higher (LTS version recommended)
- npm 9.0.0 or higher

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/lionelschiepers/StockQuotes.MCP.git
   cd StockQuotes.MCP
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Run linter**
   ```bash
   npm run lint
   ```

6. **Format code**
   ```bash
   npm run format
   ```

7. **Inspect server**
   ```bash
   npm run inspect
   ```

## 🚦 Usage

### Command Line Options

```bash
# Start with stdio transport (for CLI tools)
npm run start:stdio

# Start with HTTP transport on default port 3000
npm run start:http

# Start with custom HTTP port
npm run start:http -- --http-port 8080

# Development mode with hot reload (stdio transport)
npm run dev
```

### Available MCP Tools

#### 1. `get_stock_quote`
Fetch current stock quote data for a given ticker symbol.

**Input:**
```json
{
  "ticker": "AAPL",
  "fields": [
    "symbol",
    "shortName",
    "longName",
    "currency",
    "exchange",
    "regularMarketPrice"
  ]
}
```

**Output:**
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "exchange": "NMS",
  "currency": "USD",
  "regularMarketPrice": 260.36,
  "marketState": "REGULAR",
  "quoteType": "EQUITY"
}
```

#### 2. `search_stocks`
Search for stocks by company name or ticker symbol.

**Input:**
```json
{
  "query": "HIMS"
}
```

**Output:**
```json
[
  {
    "symbol": "HIMS",
    "name": "Hims & Hers Health, Inc.",
    "exchange": "NYQ"
  },
  {
    "symbol": "HIMS.MX",
    "name": "HIMS & HERS HEALTH INC",
    "exchange": "MEX"
  }
]
```

## 🐳 Docker Usage

### Build the image
```bash
docker build -t stockquotes-mcp:latest .
```

### Run the container

**With HTTP transport:**
```bash
docker run -p 3000:3000 stockquotes-mcp:latest
```

**With stdio transport:**
```bash
docker run --rm -it stockquotes-mcp:latest node dist/index.js --transport stdio
```

## 🤖 Integration with AI Platforms

### Cline

1. **Direct Integration**
   Add to your Cline MCP settings:
   ```json
   {
     "mcpServers": {
       "stock-quotes": {
        "disabled": false,
        "timeout": 120,
        "type": "streamableHttp",
        "url": "http://localhost:3000/mcp"
       }
     }
   }
   ```

### Gemini CLI

Gemini CLI supports MCP servers through its configuration file. Here's how to configure it:

**Method 1: Using Gemini CLI command (if supported)**
```bash
# Add the server (CLI) to your configuration
gemini mcp add stock-quotes node "\path\node\project\dist\index.js --transport stdio"
```

**Method 2: Manual Configuration**

1. Create or edit Gemini CLI's config file (typically `~/.gemini/settings.json`):

HTTP
```json
{
  "mcpServers": {
    "stock-quotes": {
      "httpUrl": "http://localhost/mcp",
      "headers": {
        "Accept": "application/json, text/event-stream"
      }
    }
  }
}
```

CLI
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

**Verifying the Configuration:**

After adding the configuration, verify it's working:

```bash
# List configured MCP servers
gemini mcp list
```

**Using with Gemini CLI:**

Once configured, you can use the tools in your conversations:

```
What's the current price of Apple stock?
→ This will use the get_stock_quote tool to fetch AAPL data

Search for Microsoft stock
→ This will use the search_stocks tool to find MSFT
```

**Note:** Gemini CLI configuration files may vary by version. Check your CLI's documentation for the exact location and format of the configuration file.

### Other MCP Clients

The server can be integrated with any MCP-compatible client:

```json
{
  "mcpServers": {
    "stock-quotes": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js", "--transport", "stdio"]
    }
  }
}
```

## 🔧 Configuration

### Transport Options

- **stdio**: Best for CLI tools and local MCP clients
- **http**: Best for remote deployments and web-based clients

## 📊 Available Stock Data

The server provides access to the following stock metrics:

- **Price Data**: Current price, change, change percent
- **Volume**: Trading volume, average volume
- **Market Cap**: Total market capitalization
- **Ratios**: P/E ratio (forward and trailing)
- **52-Week Range**: High and low prices
- **Dividends**: Dividend yield
- **Earnings**: EPS (forward and trailing)
- **Book Value**: Book value and P/B ratio

## 🧪 Testing

### Run all tests
```bash
npm test
```

### Run tests with coverage
```bash
npm run test:coverage
```

## 🔍 Code Quality

### Linting
```bash
npm run lint              # Check for issues
npm run lint:fix          # Auto-fix issues
```

### Code Formatting
```bash
npm run format            # Format code
npm run format:check      # Check formatting
```

## 🚀 CI/CD Pipeline

The project includes a comprehensive GitHub Actions workflow that:

1. **Builds**: Compiles TypeScript.
2. **Tests**: Runs Jest tests
3. **Containerizes**: Builds Docker images
4. **Publishes**: Pushes to Docker Hub Container Registry

### Pipeline Triggers

- **Push to main**: Full CI/CD pipeline
- **Push to feature**: Full CI pipeline

## 📝 API Reference

### HTTP Endpoints (when using HTTP transport)

- `POST /mcp` - MCP protocol endpoint
- `GET /health` - Health check endpoint

### Response Format

All MCP responses follow the JSON-RPC 2.0 specification:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"symbol\":\"AAPL\",\"price\":150.25}"
      }
    ],
    "structuredContent": {
      "symbol": "AAPL",
      "price": 150.25
    }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure all tests pass and code is properly formatted before submitting.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Yahoo Finance2](https://github.com/gadicc/yahoo-finance2) for the excellent API wrapper
- [Model Context Protocol](https://modelcontextprotocol.io/) for the standardized protocol
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) for the server implementation

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/lionelschiepers/StockQuotes-MCP/issues)
- **Discussions**: [GitHub Discussions](https://github.com/lionelschiepers/StockQuotes-MCP/discussions)

---

**Note**: This project is for educational and development purposes. Stock data is provided by Yahoo Finance and may be delayed. Always verify with official sources before making investment decisions.
