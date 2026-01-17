# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2026-01-17

### Added
- Comprehensive test coverage (98%+)
- HTTP transport strategy with Express
- Stdio transport strategy
- Docker support with health checks
- CI/CD pipeline with security scanning
- Zod schemas for input validation (ready for integration)

### Changed
- Refactored server to use Strategy pattern for transports
- Standardized on Node.js 24
- Updated dependencies to latest versions

### Fixed
- Fixed AGENTS.md project type
- Fixed Docker health check endpoint

## [1.0.0] - 2025-01-01

### Added
- Initial release of StockQuotes.MCP
- Basic Yahoo Finance integration
- get_stock_quote tool
- search_stocks tool
- get_historical_data tool
