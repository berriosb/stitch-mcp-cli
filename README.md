# stitch-mcp-cli 

**Universal Stitch MCP + CLI**

Híbrido MCP + CLI para conectar Google Stitch con tus agentes de código y tus pipelines:

- `stitch-mcp-cli setup` → auto-configura MCP en **Cursor, Claude Code, OpenCode, Antigravity, VS Code, Codex CLI** (y otros IDEs compatibles).
- `stitch-mcp-cli mcp` → lanza el servidor Stitch MCP local para cualquier cliente MCP.
- `stitch-mcp-cli sync` → sincroniza diseños de Stitch a tu proyecto (HTML/CSS/tokens, listo para mapear a React/Next.js/Vue/etc.).

##  ¿Por qué un enfoque híbrido (MCP + CLI)?

- **Un solo paquete para todo**: el mismo proyecto te da un **servidor MCP estándar** para editores y un **CLI** para scripts, CI/CD y terminal. No tienes que instalar cosas distintas para IDE y pipeline.
- **Multi-editor real**: el comando `setup` detecta editores/CLIs MCP (Cursor, Claude Code, OpenCode, Antigravity, VS Code, Codex, etc.) y escribe sus configs nativas para apuntar a `stitch-mcp-cli`.
- **Multi-framework por diseño**: el servidor MCP devuelve datos neutrales (HTML/CSS/tokens) desde Stitch, y el CLI se encarga del scaffolding. Puedes mapear esos resultados a React/Next.js, Vue, Svelte, Flutter o lo que uses en tu stack.
- **Menos fricción, más adopción**: configurar MCP a mano en cada IDE es tedioso. Con `stitch-mcp-cli setup` lo haces una vez y ya puedes escribir «usa stitch» en tu agente, sin tocar archivos de config.

##  Quickstart

```bash
npm install -g stitch-mcp-cli

# 1) Configurar MCP en todos los IDEs/CLIs detectados
stitch-mcp-cli setup

# 2) Lanzar el servidor Stitch MCP local
stitch-mcp-cli mcp

# 3) Sincronizar un diseño de Stitch al proyecto actual
stitch-mcp-cli sync "Landing Page" --output src/stitch
```

Luego, en tu editor (Cursor, Claude Code, OpenCode, Antigravity, etc.), pídele al agente:

> Usa el MCP `stitch` para generar o actualizar el diseño de la landing.

##  Comandos

### `setup`

Detecta IDEs/CLIs compatibles y escribe las configuraciones MCP necesarias para apuntar a `stitch-mcp-cli`.

```bash
stitch-mcp-cli setup
# Ejemplo de salida:
#  cursor: ~/.cursor/mcp.json
#  claude: ~/.claude/claude_desktop_config.json
#  opencode: ~/.config/opencode/opencode.json
# ...
```

### `mcp`

Lanza el servidor Stitch MCP como proceso local.

```bash
stitch-mcp-cli mcp
# Escuchando en http://localhost:3001
```

### `sync <designName>`

Sincroniza un diseño de Stitch con el proyecto actual. Por defecto guarda HTML/CSS/tokens en `src/`, pero se puede personalizar.

```bash
stitch-mcp-cli sync "Dashboard de Analytics" --output src/stitch
```

##  Roadmap

- [ ] Soporte avanzado de scaffolding por framework (React/Next.js, Vue/Nuxt, SvelteKit, Flutter).
- [ ] Integraciones de despliegue (Vercel, Cloudflare, etc.).
- [ ] Modo «watch» para actualizar el código cuando cambie el diseño en Stitch.

## 📝 Licencia

MIT
