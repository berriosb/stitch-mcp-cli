# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
