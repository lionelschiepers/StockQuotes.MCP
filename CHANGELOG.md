## [1.0.7](https://github.com/lionelschiepers/StockQuotes.MCP/compare/v1.0.6...v1.0.7) (2026-01-19)


### Bug Fixes

* don't run test in publish ([f0a8786](https://github.com/lionelschiepers/StockQuotes.MCP/commit/f0a8786f54d237e0dccc1a7397928637b6b92fa0))

## [1.0.6](https://github.com/lionelschiepers/StockQuotes.MCP/compare/v1.0.5...v1.0.6) (2026-01-19)


### Bug Fixes

* build before release to npm ([5666ccc](https://github.com/lionelschiepers/StockQuotes.MCP/commit/5666ccc720fdee9ccb186ddaca00e847a198dea8))

## [1.0.5](https://github.com/lionelschiepers/StockQuotes.MCP/compare/v1.0.4...v1.0.5) (2026-01-19)


### Bug Fixes

* husky on linux ([7b3bfe8](https://github.com/lionelschiepers/StockQuotes.MCP/commit/7b3bfe8ac392aadf623cd00505de20e25a3a8771))
* sonarqube warnings ([444ba30](https://github.com/lionelschiepers/StockQuotes.MCP/commit/444ba3057666d73e9273f5a13baa40deaee5e2ef))

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
