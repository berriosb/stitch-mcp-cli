# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.2.1](https://github.com/berriosb/stitch-mcp-cli/compare/v0.2.0...v0.2.1) (2026-06-08)


### Bug Fixes

* **ci:** use OIDC provenance for npm publishing ([fa5dc6e](https://github.com/berriosb/stitch-mcp-cli/commit/fa5dc6e9703a6ddec901172368b7bfe873a1c7eb))

## [0.2.0](https://github.com/berriosb/stitch-mcp-cli/compare/v0.1.12...v0.2.0) (2026-06-08)


### Features

* add stitch-design-taste skill and interactive setup prompt ([ca8e4d9](https://github.com/berriosb/stitch-mcp-cli/commit/ca8e4d9e8b1b61b403469cff7726b926442ec61d))
* upgrade stitch-sdk to 0.3.5 with new MCP tools and CLI commands ([8e1c500](https://github.com/berriosb/stitch-mcp-cli/commit/8e1c5001d081557ce8ca07b0464d16dcd20416b9))


### Bug Fixes

* full framework support in MCP server and CLI export ([62f26e1](https://github.com/berriosb/stitch-mcp-cli/commit/62f26e11b082b5d6b0015dd989997110ef3adab5))

## [1.0.0] - YYYY-MM-DD

### Added

- Initial release with CLI and MCP server support
- `stitch-mcp-cli auth` - Configure API key
- `stitch-mcp-cli setup` - Auto-configure IDEs
- `stitch-mcp-cli projects` - List projects
- `stitch-mcp-cli generate` - Generate screens
- `stitch-mcp-cli sync` - Sync to HTML
- `stitch-mcp-cli export` - Export to frameworks
- `stitch-mcp-cli cache` - Cache management
- MCP server with stdio and HTTP transports
- Secure API key encryption (AES-256-GCM)
- Rate limiting (60 req/min)
- Structured logging with Pino
- Graceful shutdown handling
- Zod validation for inputs
