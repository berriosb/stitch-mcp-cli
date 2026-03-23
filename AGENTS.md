# AGENTS.md - stitch-mcp-cli

## Project Overview

This repository contains documentation and planning for a **Stitch MCP + CLI hybrid** project. The actual implementation code does not exist yet—this is a documentation/guide repository.

**Goal**: Build a universal MCP server + CLI that connects Google Stitch with AI coding agents (Cursor, Claude Code, OpenCode, Antigravity, VS Code, Codex CLI, etc.).

---

## Repository Structure

```
stitch-mcp-cli/
├── README.md                                    # Project documentation
├── Guía para construir un híbrido...md          # Detailed implementation guide (Spanish)
├── .agents/skills/mcp-builder/SKILL.md         # MCP development guidelines
├── skills-lock.json                             # Locked skills configuration
└── src/                                         # (To be created) Source code
    ├── bin/
    │   └── cli.js                               # CLI entry point
    ├── server/
    │   └── mcp-server.js                        # MCP server implementation
    └── lib/
        ├── setup-multi.js                       # Multi-editor configuration
        └── sync.js                              # Design sync/scaffolding
```

---

## Commands

### When Code Exists

```bash
# Install dependencies
npm install          # npm (default)
pnpm install         # pnpm (recommended - faster)
yarn                 # yarn

# Run CLI directly
npm start            # or: node bin/cli.js

# Launch MCP server
npm run mcp          # or: node server/mcp-server.js

# Build (TypeScript if using TS)
npm run build

# Lint
npm run lint

# Type check
npm run typecheck

# Run tests
npm test             # Run all tests
npm test -- <file>   # Run single test file
```

### Development Workflow

```bash
# Watch mode (if supported)
pnpm dev              # or npm run dev

# Test MCP server with Inspector
npx @modelcontextprotocol/inspector
```

---

## Code Style Guidelines

### General Principles

Based on the [mcp-builder skill](./.agents/skills/mcp-builder/SKILL.md):

- **TypeScript preferred** for MCP servers (recommended by MCP SDK team)
- **Async/await** for all I/O operations
- **Zod** for input schema validation (TypeScript)
- Clear, descriptive tool names with consistent prefixes (e.g., `stitch_generate_ui`)
- Actionable error messages with specific suggestions

### TypeScript Patterns

```typescript
// Tool registration pattern
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const server = new McpServer({ name: 'stitch-mcp-cli', version: '1.0.0' });

server.registerTool(
  'stitch_generate_ui',
  {
    description: 'Genera UI y código a partir de un prompt usando Google Stitch',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt de diseño' },
        projectId: { type: 'string', description: 'ID del proyecto Stitch' }
      },
      required: ['prompt']
    },
    annotations: {
      readOnlyHint: true,
      idempotentHint: false,
      openWorldHint: false
    }
  },
  async ({ prompt, projectId }) => {
    // Implementation
    return {
      content: [
        { type: 'text', text: result.html },
        { type: 'text', text: result.css }
      ],
      structuredContent: { html: result.html, css: result.css }
    };
  }
);
```

### JavaScript Style (Node.js CLI)

```javascript
// CLI with Commander
const { program } = require('commander');
const { setupMulti } = require('../lib/setup-multi');

// Use async/await in actions
program
  .command('setup')
  .description('Auto-configurar MCP en IDEs/CLIs compatibles')
  .action(async () => {
    try {
      await setupMulti();
    } catch (error) {
      console.error('Setup failed:', error.message);
      process.exit(1);
    }
  });
```

### Error Handling

```javascript
// Consistent error handling pattern
async function safeOperation() {
  try {
    const result = await riskyOperation();
    return result;
  } catch (error) {
    if (error.code === 'AUTH_ERROR') {
      throw new Error('Autenticación fallida. Ejecuta: stitch-mcp-cli auth');
    }
    throw new Error(`Operación fallida: ${error.message}`);
  }
}
```

### File Organization

- **bin/**: CLI entry points (executable)
- **server/**: MCP server implementation
- **lib/**: Shared utilities and modules
- **src/**: Alternative source directory (if using TypeScript src layout)

### Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| CLI commands | kebab-case | `stitch-mcp-cli setup` |
| MCP tools | snake_case with prefix | `stitch_generate_ui` |
| Functions | camelCase | `setupMulti`, `syncDesign` |
| Config files | kebab-case or snake_case | `mcp_config.json` |
| Environment variables | UPPER_SNAKE | `STITCH_MCP_PORT` |

---

## MCP Server Transport

- **stdio**: For local CLI invocation (recommended for this hybrid approach)
- **Streamable HTTP**: For remote server deployment

---

## Editor Configuration Paths

| Editor | Config Path |
|--------|-------------|
| Cursor | `~/.cursor/mcp.json` |
| Claude Code | `~/.claude/claude_desktop_config.json` |
| OpenCode | `~/.config/opencode/opencode.json` |
| Antigravity | `~/.antigravity/mcp_config.json` |
| Codex CLI | `~/.codex/config.toml` |

---

## Documentation Notes

- This project uses **Spanish** for main documentation (Guía para construir un híbrido...)
- README.md and user-facing docs should be in Spanish
- Code comments can be in English or Spanish (be consistent within files)
- Commit messages should be in English

---

## Future Implementation Notes

When building the actual MCP server:

1. Use `@modelcontextprotocol/sdk` for TypeScript implementation
2. Implement Zod schemas for all tool inputs
3. Use Google Cloud Application Default Credentials for authentication
4. Support both stdio (local) and HTTP (remote) transports
5. Test with `npx @modelcontextprotocol/inspector`
