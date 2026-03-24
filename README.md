# stitch-mcp-cli

**CLI + MCP Server para Google Stitch con scaffolding multi-framework**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![License](https://img.shields.io/badge/license-MIT-green)

## Características

- ⚡ **Setup en 30 segundos** - Solo necesitas una API key
- 🔐 **Seguridad** - API key encriptada con AES-256-GCM
- 🎨 **Scaffolding universal** - Exporta a React, Vue, Svelte, Next.js, y más
- 👀 **Watch mode** - Sincronización continua cuando cambia el diseño
- 💾 **Offline cache** - Trabaja sin conexión con proyectos cacheados
- 🔧 **Multi-IDE** - Configura automáticamente Cursor, Claude Code, VS Code, OpenCode, Antigravity, Codex CLI
- 🧪 **Evaluaciones MCP** - Benchmark tools para LLMs
- 📡 **HTTP + stdio** - Dos transportes MCP disponibles
- 🚦 **Rate limiting** - 60 req/min para evitar bloqueos
- 📝 **Logging estructurado** - Pino logger con niveles configurables
- ✅ **TypeScript strict** - Tipado completo y verificado

## Quickstart

```bash
# 1. Instalar
npm install -g stitch-mcp-cli

# 2. Configurar API key (encriptada automáticamente)
stitch-mcp-cli auth --api-key TU_API_KEY

# 3. Configurar IDEs
stitch-mcp-cli setup

# 4. Listar proyectos
stitch-mcp-cli projects
```

Obtén tu API key en: https://stitch.withgoogle.com/settings

## MCP Server

El CLI también funciona como **MCP Server** para integrar con AI coding agents:

```bash
#Modo stdio (local) - Para IDEs
stitch-mcp-cli mcp

# Modo HTTP (remoto) - Puerto 3100
stitch-mcp-cli mcp:http
```

### Tools disponibles en MCP:

| Tool | Descripción |
|------|-------------|
| `stitch_list_projects` | Lista proyectos (con búsqueda) |
| `stitch_generate_screen` | Genera pantalla desde prompt |
| `stitch_sync_screen` | Sync a HTML |
| `stitch_export_framework` | Exporta a framework |
| `stitch_cache_status` | Estado de caché |
| `stitch_cache_clear` | Limpia caché |
| `stitch_cache_sync` | Sincroniza proyecto a caché |

## Comandos

| Comando | Descripción |
|---------|-------------|
| `auth` | Configurar API key (encriptada) |
| `setup` | Auto-configurar IDEs |
| `projects` | Listar proyectos |
| `generate` | Generar pantalla |
| `sync` | Sync a archivos |
| `export` | Exportar a framework |
| `watch` | Watch mode |
| `cache` | Gestionar caché |
| `eval` | Ejecutar evaluaciones MCP |
| `design-md` | Extraer design system |

### Auth

```bash
# Configurar API key (se encripta automáticamente)
stitch-mcp-cli auth --api-key <key>

# Verificar configuración
stitch-mcp-cli auth --check
```

### Projects

```bash
# Listar todos los proyectos
stitch-mcp-cli projects

# Listar con formato JSON
stitch-mcp-cli projects --json

# Filtrar por nombre
stitch-mcp-cli projects --search "dashboard"

# Modo offline
stitch-mcp-cli projects --offline
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

## Desarrollo

```bash
# Clonar repositorio
git clone https://github.com/berriosb/stitch-mcp-cli.git
cd stitch-mcp-cli

# Instalar dependencias
pnpm install

# Desarrollo (watch mode)
pnpm dev

# Build
pnpm run build

# Tests
pnpm test

# Typecheck
pnpm run typecheck

# Inspect MCP server
pnpm run inspector
```

## Seguridad

- La API key se encripta con **AES-256-GCM** y se guarda en `~/.stitch-mcp-cli/config.json`
- La clave de encriptación se guarda en `~/.stitch-mcp-cli/.key` con permisos `0600`
- El SDK usa header `X-Goog-Api-Key`, no query params
- Añade restricciones a tu API key en Google Cloud Console
- Rate limiting: 60 requests por minuto

## Logging

El servidor usa **Pino** para logging estructurado:

```bash
# Nivel de log (default: info)
LOG_LEVEL=debug stitch-mcp-cli mcp

# Ver logs en desarrollo
NODE_ENV=development stitch-mcp-cli mcp
```

## Environment Variables

| Variable | Default | Descripción |
|----------|---------|-------------|
| `STITCH_API_KEY` | - | API key de Stitch |
| `LOG_LEVEL` | `info` | Nivel de log |
| `NODE_ENV` | `production` | Entorno (development/production) |
| `MCP_PORT` | `3100` | Puerto HTTP (solo mcp:http) |
| `MCP_HOST` | `localhost` | Host HTTP (solo mcp:http) |

## Changelog

Ver [CHANGELOG.md](./CHANGELOG.md) para historial de cambios.

Para generar changelog con conventional commits:
```bash
pnpm run changelog
```

## Roadmap

### v1.0.0 - Production Ready ✅
- [x] MCP Server propio con 7 tools
- [x] CLI completa con 10 comandos
- [x] API key encriptada (AES-256-GCM)
- [x] Rate limiting (60 req/min)
- [x] Logging estructurado (Pino)
- [x] Graceful shutdown
- [x] HTTP + stdio transports
- [x] TypeScript strict mode
- [x] Zod validation
- [x] 58 tests (unit + integration)
- [x] CI/CD con GitHub Actions

### v1.1.0 - Enhanced Features
- [ ] Template engine mejorado
- [ ] Más frameworks (Angular, Solid)
- [ ] Watch mode avanzado

### v1.2.0 - Cloud
- [ ] MCP sobre HTTP con autenticación
- [ ] Deploy a cloud functions
- [ ] Multi-user support

## Licencia

MIT
