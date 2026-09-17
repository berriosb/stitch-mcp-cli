# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.2.3](https://github.com/berriosb/stitch-mcp-cli/compare/v0.2.2...v0.2.3) (2026-09-15)


### Bug Fixes

* **release:** switch to OIDC-only npm publish (drop NPM_TOKEN env, keep provenance)
* **version:** sync `PKG_VERSION` from package.json — MCP `serverInfo` and CLI `--version` no longer report stale 2.0.0 / 0.2.0
* **export:** Next.js `--routes` maps each route to a distinct screen (was always screen[0]); supports `route=screenId` syntax
* **resolveHtml:** log warning when Stitch screen HTML fetch fails instead of returning `<div></div>` silently; add 15s timeout
* **template-engine:** fail-fast in `renderStorybookStory` when framework is unsupported or template missing


### Features

* **stitch_to_storybook:** new MCP tool + `stitch-mcp-cli storybook <project-id>` command — exports a Stitch project to ready-to-run Storybook 8 stories for React, Next.js, Vue 3, Nuxt 3, Svelte 5, SvelteKit. Writes one component + one story per screen plus a minimal `.storybook/main.ts` + `preview.ts`. Run `npx storybook@latest init && npx storybook dev` after to boot.


### [0.2.2](https://github.com/berriosb/stitch-mcp-cli/compare/v0.2.1...v0.2.2) (2026-06-08)


### Bug Fixes

* **ci:** remove NPM_TOKEN, use OIDC only ([c9a92a1](https://github.com/berriosb/stitch-mcp-cli/commit/c9a92a1bb9a73d54060efebcaaef31e8cb09b11b))

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
