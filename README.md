# MCP Stock Quotes Server

A Model Context Protocol (MCP) server for fetching stock quotes from Yahoo Finance. This server provides AI assistants and tools with access to real-time and historical stock market data through a standardized MCP interface.

## 🚀 Features

- **Multiple Transport Support**: stdio, HTTP, and SSE transports for flexible integration
- **Real-time Stock Quotes**: Fetch current prices, volume, market cap, and key metrics
- **Stock Search**: Search for stocks by company name or ticker symbol
- **Comprehensive Data**: Support for stocks, ETFs, cryptocurrencies, and other financial instruments
- **TypeScript**: Full TypeScript support with type safety
- **Well Tested**: Unit tests with Jest and good code coverage
- **Production Ready**: Docker containerization and CI/CD pipeline

## 📁 Project Structure

```
mcp-server-stockquotes/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI/CD workflow
├── .vscode/
│   ├── extensions.json            # VS Code extension recommendations
│   └── settings.json              # VS Code workspace settings
├── src/
│   ├── index.ts                   # Main entry point with CLI
│   ├── server.ts                  # MCP server implementation
│   ├── stockQuotesService.ts      # Yahoo Finance service layer
│   └── types.ts                   # TypeScript type definitions
├── tests/
│   └── stockQuotesService.test.ts # Unit tests
├── .eslintrc.json                 # ESLint configuration
├── .gitignore                     # Git ignore rules
├── Dockerfile                     # Docker containerization
├── jest.config.js                 # Jest testing configuration
├── package.json                   # Project dependencies
├── prettier.config.js             # Prettier code formatter
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # This file
```

## 🛠️ Installation

### Prerequisites

- Node.js 22.0.0 or higher (LTS version recommended)
- npm 9.0.0 or higher

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mcp-server-stockquotes.git
   cd mcp-server-stockquotes
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

## 🚦 Usage

### Command Line Options

```bash
# Start with stdio transport (for CLI tools and MCP clients)
npm run start:stdio

# Start with HTTP transport on default port 3000
npm run start:http

# Start with SSE transport on default port 3001
npm run start:sse

# Start with custom ports
npm run start:http -- --http-port 8080
npm run start:sse -- --sse-port 8081

# Development mode with hot reload
npm run dev
```

### Available MCP Tools

#### 1. `get_stock_quote`
Fetch current stock quote data for a given ticker symbol.

**Input:**
```json
{
  "ticker": "AAPL",
  "fields": ["regularMarketPrice", "marketCap", "trailingPE"]
}
```

**Output:**
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "exchange": "NASDAQ",
  "currency": "USD",
  "regularMarketPrice": 150.25,
  "regularMarketChange": 2.5,
  "regularMarketChangePercent": 1.69,
  "regularMarketVolume": 50000000,
  "marketCap": 2500000000000,
  "fiftyTwoWeekLow": 120.0,
  "fiftyTwoWeekHigh": 175.0,
  "trailingPE": 25.0,
  "marketState": "REGULAR"
}
```

#### 2. `search_stocks`
Search for stocks by company name or ticker symbol.

**Input:**
```json
{
  "query": "apple"
}
```

**Output:**
```json
{
  "results": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "exchange": "NASDAQ"
    }
  ]
}
```

## 🐳 Docker Usage

### Build the image
```bash
docker build -t mcp-server-stockquotes:latest .
```

### Run the container

**With HTTP transport:**
```bash
docker run -p 3000:3000 mcp-server-stockquotes:latest
```

**With stdio transport:**
```bash
docker run --rm mcp-server-stockquotes:latest node dist/index.js --transport stdio
```

**With environment variables:**
```bash
docker run -e PORT=8080 -p 8080:3000 mcp-server-stockquotes:latest
```

### Using Docker Compose

```yaml
version: '3.8'
services:
  mcp-server:
    image: mcp-server-stockquotes:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

## 🤖 Integration with AI Platforms

### Claude Code (Cline)

1. **Using MCP CLI (Recommended)**
   ```bash
   # Add the server to your MCP configuration
   mcp add-server stock-quotes-server --transport stdio --command "node /path/to/dist/index.js --transport stdio"
   ```

2. **Direct Integration**
   Add to your Cline MCP settings:
   ```json
   {
     "mcpServers": {
       "stock-quotes": {
         "command": "node",
         "args": ["/path/to/mcp-server-stockquotes/dist/index.js", "--transport", "stdio"]
       }
     }
   }
   ```

### VS Code

1. Open the project in VS Code
2. Install recommended extensions (prompted on first open)
3. Use the integrated terminal to run commands
4. Debug configurations are ready in `.vscode/launch.json`

### Gemini CLI

Gemini CLI supports MCP servers through its configuration file. Here's how to configure it:

**Method 1: Using Gemini CLI command (if supported)**
```bash
# Add the server to your configuration
gemini mcp add stock-quotes node "\path\node\project\dist\index.js --transport stdio"
```

**Method 2: Manual Configuration**

1. Create or edit Gemini CLI's config file (typically `~/.config/gemini-cli/config.json` or `~/.gemini-cli.json`):

```json
{
  "mcpServers": {
    "stock-quotes": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-stockquotes/dist/index.js", "--transport", "stdio"],
      "disabled": false,
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Method 3: Using environment-specific configuration**

If you want different configurations for different environments:

```json
{
  "mcpServers": {
    "stock-quotes": {
      "command": "node",
      "args": ["${HOME}/projects/mcp-server-stockquotes/dist/index.js", "--transport", "stdio"],
      "disabled": false
    },
    "stock-quotes-https": {
      "command": "node",
      "args": ["${HOME}/projects/mcp-server-stockquotes/dist/index.js", "--transport", "http", "--http-port", "3000"],
      "disabled": false,
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

**Verifying the Configuration:**

After adding the configuration, verify it's working:

```bash
# List configured MCP servers
gemini list-mcp-servers

# Test the connection
gemini mcp stock-quotes get_stock_quote --ticker AAPL
```

**Using with Gemini CLI:**

Once configured, you can use the tools in your conversations:

```
Gemini, what's the current price of Apple stock?
→ This will use the get_stock_quote tool to fetch AAPL data

Gemini, search for Microsoft stock
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

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | HTTP server port | `3000` |
| `HTTP_PORT` | Override HTTP port | `3000` |
| `SSE_PORT` | Override SSE port | `3001` |

### Transport Options

- **stdio**: Best for CLI tools and local MCP clients
- **HTTP**: Best for remote deployments and web-based clients
- **SSE**: Best for clients that require Server-Sent Events

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

### Run tests in watch mode
```bash
npm run test:watch
```

### Test coverage thresholds
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

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

1. **Lints and Tests**: Runs ESLint, Prettier, and Jest tests
2. **Builds**: Compiles TypeScript and runs all checks
3. **Containerizes**: Builds Docker images
4. **Publishes**: Pushes to GitHub Container Registry
5. **Releases**: Creates GitHub releases on version tags

### Pipeline Triggers

- **Push to main**: Full CI/CD pipeline
- **Push to develop**: Lint and test only
- **Pull requests**: Lint and test only
- **Version tags (v*)**: Full release pipeline

## 📝 API Reference

### HTTP Endpoints (when using HTTP/SSE transport)

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

- **Issues**: [GitHub Issues](https://github.com/yourusername/mcp-server-stockquotes/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/mcp-server-stockquotes/discussions)
- **Wiki**: [GitHub Wiki](https://github.com/yourusername/mcp-server-stockquotes/wiki)

---

**Note**: This project is for educational and development purposes. Stock data is provided by Yahoo Finance and may be delayed. Always verify with official sources before making investment decisions.
