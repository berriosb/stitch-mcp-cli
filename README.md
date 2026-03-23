# stitch-mcp-cli

**CLI + MCP Proxy para Google Stitch con scaffolding multi-framework**

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![License](https://img.shields.io/badge/license-MIT-green)

## Características

- ⚡ **Setup en 30 segundos** - Solo necesitas una API key
- 🎨 **Scaffolding universal** - Exporta a React, Vue, Svelte, Next.js, y más
- 👀 **Watch mode** - Sincronización continua cuando cambia el diseño
- 💾 **Offline cache** - Trabaja sin conexión con proyectos cacheados
- 🔧 **Multi-IDE** - Configura automáticamente Cursor, Claude Code, VS Code, OpenCode, Antigravity, Codex CLI
- 🧪 **Evaluaciones MCP** - Benchmark tools para LLMs

## Quickstart

```bash
# 1. Instalar
npm install -g stitch-mcp-cli

# 2. Configurar API key
stitch-mcp-cli auth --api-key TU_API_KEY

# 3. Configurar IDEs
stitch-mcp-cli setup

# 4. Listar proyectos
stitch-mcp-cli projects
```

Obtén tu API key en: https://stitch.withgoogle.com/settings

## Comandos

| Comando | Descripción |
|---------|-------------|
| `auth` | Configurar API key |
| `setup` | Auto-configurar IDEs |
| `projects` | Listar proyectos |
| `generate` | Generar pantalla |
| `sync` | Sync a archivos |
| `export` | Exportar a framework |
| `watch` | Watch mode |
| `cache` | Gestionar caché |

### Auth

```bash
# Configurar API key
stitch-mcp-cli auth --api-key <key>

# Verificar configuración
stitch-mcp-cli auth --check
```

### Setup

```bash
# Auto-detectar y configurar IDEs
stitch-mcp-cli setup

# Configurar solo IDE específico
stitch-mcp-cli setup --editor cursor

# Modo verbose
stitch-mcp-cli setup --verbose
```

### Projects

```bash
# Listar todos los proyectos
stitch-mcp-cli projects

# Listar con formato JSON
stitch-mcp-cli projects --json

# Filtrar por nombre
stitch-mcp-cli projects --search "dashboard"
```

### Generate

```bash
# Generar pantalla desde prompt
stitch-mcp-cli generate "Login form with email and password" --project-id <id>

# Generar con tipo de dispositivo
stitch-mcp-cli generate "Mobile navigation" --project-id <id> --device mobile
```

### Sync

```bash
# Sync pantalla específica
stitch-mcp-cli sync <project-id> <screen-id> --output ./src/stitch

# Sync todos los diseños de un proyecto
stitch-mcp-cli sync --project-id <id> --output ./designs
```

### Export

```bash
# Exportar a React
stitch-mcp-cli export <project-id> --framework react --output ./src/components

# Exportar a Vue
stitch-mcp-cli export <project-id> --framework vue --output ./src/views

# Exportar a Next.js
stitch-mcp-cli export <project-id> --framework nextjs --output ./app
```

### Watch

```bash
# Modo watch con sync automático
stitch-mcp-cli watch <project-id> --output ./src/stitch --framework react
```

### Cache

```bash
# Ver estado de caché
stitch-mcp-cli cache --status

# Limpiar caché
stitch-mcp-cli cache --clear

# Sync proyecto a caché
stitch-mcp-cli cache --sync <project-id>
```

## Configuración de IDEs

### Cursor

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["stitch-mcp-cli"],
      "env": {
        "STITCH_API_KEY": "${STITCH_API_KEY}"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add stitch -- npx stitch-mcp-cli
```

### VS Code

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["stitch-mcp-cli"],
      "env": {
        "STITCH_API_KEY": "${STITCH_API_KEY}"
      }
    }
  }
}
```

### OpenCode

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["stitch-mcp-cli"],
      "env": {
        "STITCH_API_KEY": "${STITCH_API_KEY}"
      }
    }
  }
}
```

### Codex CLI

```toml
[[mcp_servers.stitch]]
command = "npx"
args = ["stitch-mcp-cli"]
env = { STITCH_API_KEY = "YOUR-API-KEY" }
```

## Desarrollo

```bash
# Clonar repositorio
git clone https://github.com/berriosb/stitch-mcp-cli.git
cd stitch-mcp-cli

# Instalar dependencias
npm install

# Desarrollo (watch mode)
npm run dev

# Build
npm run build

# Tests
npm test

# Typecheck
npm run typecheck
```

## Seguridad

- La API key se guarda en `~/.stitch-mcp-cli/config.json` (nunca en git)
- El SDK usa header `X-Goog-Api-Key`, no query params
- Añade restricciones a tu API key en Google Cloud Console

## Roadmap

### v0.1.0 - MVP ✅
- [x] MCP Proxy
- [x] CLI con Commander
- [x] Auth con API key
- [x] Setup multi-editor
- [x] Comandos básicos
- [x] Tests unitarios

### v0.2.0 - Scaffolding
- [ ] Export a más frameworks
- [ ] Template engine mejorado

### v0.3.0 - Workflow
- [ ] Watch mode avanzado
- [ ] Cache system
- [ ] Offline mode

## Licencia

MIT
