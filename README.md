# stitch-mcp-cli

**CLI + MCP Server para Google Stitch con scaffolding multi-framework**

![Version](https://img.shields.io/badge/version-0.1.5-blue)
![Node](https://img.shields.io/badge/node-%3E%3D20-green)
![pnpm](https://img.shields.io/badge/pnpm-10.23.0-orange)
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
# 1. Instalar (recomendado con pnpm)
pnpm add -g stitch-mcp-cli

# O con npm
npm install -g stitch-mcp-cli

# O con npx (sin instalar)
npx stitch-mcp-cli auth --api-key TU_API_KEY

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
# Modo stdio (local) - Para IDEs
stitch-mcp-cli mcp

# Modo HTTP (remoto) - Puerto 3100 por defecto
stitch-mcp-cli mcp:http

# Puerto personalizado
MCP_PORT=8080 stitch-mcp-cli mcp:http

# Host personalizado
MCP_HOST=0.0.0.0 MCP_PORT=8080 stitch-mcp-cli mcp:http
```

### Tools disponibles en MCP:

| Tool | Parámetros | Descripción |
|------|------------|-------------|
| `stitch_list_projects` | `search?: string`, `offline?: boolean` | Lista proyectos (con búsqueda) |
| `stitch_generate_screen` | `prompt: string`, `projectId: string`, `device?: 'mobile'\|'desktop'` | Genera pantalla desde prompt |
| `stitch_sync_screen` | `projectId: string`, `screenId?: string`, `output?: string` | Sync a HTML |
| `stitch_export_framework` | `projectId: string`, `framework: string`, `output?: string` | Exporta a framework |
| `stitch_cache_status` | - | Estado de caché |
| `stitch_cache_clear` | - | Limpia caché |
| `stitch_cache_sync` | `projectId: string` | Sincroniza proyecto a caché |

### Ejemplo de uso con MCP Inspector

```bash
# Inspeccionar servidor MCP
npx @modelcontextprotocol/inspector node dist/index.js

# O conpnpm
pnpm run inspector
```

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
| `design-md` | Extraer design system a DESIGN.md |

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

# Exportar a Svelte
stitch-mcp-cli export <project-id> --framework svelte --output ./src/lib

# Exportar a Nuxt
stitch-mcp-cli export <project-id> --framework nuxt --output ./pages

# Exportar a SolidJS
stitch-mcp-cli export <project-id> --framework solid --output ./src/components

# Exportar a Angular
stitch-mcp-cli export <project-id> --framework angular --output ./src/app/components

# Exportar a HTML vanilla
stitch-mcp-cli export <project-id> --framework vanilla --output ./designs
```

**Frameworks soportados:** `react`, `vue`, `svelte`, `nextjs`, `nuxt`, `solid`, `angular`, `vanilla`

### Eval

Ejecuta evaluaciones MCP para benchmarking de LLMs:

```bash
# Ejecutar evaluaciones con archivo por defecto
stitch-mcp-cli eval

# Ejecutar con archivo personalizado
stitch-mcp-cli eval --file ./custom-eval.xml

# Guardar resultados en JSON
stitch-mcp-cli eval --results
```

El archivo de evaluación debe estar en `evaluations/stitch-mcp-eval.xml` con formato:

```xml
<qa_pair>
  <question>Lista todos los proyectos</question>
  <answer>Lista de proyectos</answer>
  <tool_used>list_projects</tool_used>
</qa_pair>
```

### Design-MD

Extrae el design system del proyecto a un archivo `DESIGN.md`:

```bash
# Generar DESIGN.md con projectId desde caché
stitch-mcp-cli design-md

# Especificar proyecto
stitch-mcp-cli design-md --project-id <id>

# Personalizar output
stitch-mcp-cli design-md --output ./docs/DESIGN.md

# Sincronizar pantallas también
stitch-mcp-cli design-md --sync
```

El archivo generado incluye:
- Tema visual y atmósfera
- Paleta de colores con roles
- Reglas de tipografía
- Estilos de componentes
- Principios de layout
- Tokens para generación Stitch

### Cache

```bash
# Ver estado de caché
stitch-mcp-cli cache --status

# Limpiar caché
stitch-mcp-cli cache --clear

# Sync proyecto a caché
stitch-mcp-cli cache --sync <project-id>
```

## Templates Personalizados

Puedes crear templates custom para frameworks sobrescribiendo los defaults:

```
~/.stitch-mcp-cli/templates/
├── react/
│   └── component.ejs
├── vue/
│   └── component.ejs
├── svelte/
│   └── component.ejs
└── custom-framework/
    └── component.ejs
```

Variables disponibles en templates EJS:

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `componentName` | string | Nombre del componente en PascalCase |
| `html` | string | HTML generado por Stitch |
| `css` | string\|undefined | CSS extraído del diseño |

Ejemplo de template React custom:

```ejs
import React from 'react';
import styles from './<%= componentName %>.module.css';

interface <%= componentName %>Props {
  className?: string;
}

export const <%= componentName %>: React.FC<<%= componentName %>Props> = ({ className }) => {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      <style>{`<%= css || '' %>`}</style>
      <%= html %>
    </div>
  );
};
```

### Configurar directorio de templates

```bash
# En ~/.stitch-mcp-cli/config.json
{
  "templateDir": "/path/to/custom/templates"
}

# O con variable de entorno
STITCH_TEMPLATE_DIR=./templates stitch-mcp-cli export <project-id> --framework react
```

## Configuración de IDEs

### Cursor

Archivo: `~/.cursor/mcp.json`

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

O manualmente en `~/.claude/claude_desktop_config.json`:

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

### VS Code

Archivo: `.vscode/mcp.json` o configuración de workspace

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

Archivo: `~/.config/opencode/opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "stitch": {
      "type": "local",
      "command": ["npx", "stitch-mcp-cli"],
      "enabled": true,
      "environment": {
        "STITCH_API_KEY": "${STITCH_API_KEY}"
      }
    }
  }
}
```

### Kilo

Archivo: `~/.config/kilo/kilo.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "stitch": {
      "type": "local",
      "command": ["npx", "stitch-mcp-cli"],
      "enabled": true,
      "environment": {
        "STITCH_API_KEY": "${STITCH_API_KEY}"
      }
    }
  }
}
```

### Codex CLI

Archivo: `~/.codex/config.toml`

```toml
[mcp.stitch]
command = "npx"
args = ["stitch-mcp-cli"]
env = { STITCH_API_KEY = "${STITCH_API_KEY}" }
```

### Antigravity

Archivo: `~/.antigravity/mcp_config.json`

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

### Configuración automática

El comando `setup` detecta y configura automáticamente todos los IDEs instalados:

```bash
stitch-mcp-cli setup

# Configurar solo IDEs específicos
stitch-mcp-cli setup --editors cursor,claude,opencode
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

## Troubleshooting

### Error: Cannot find module '@google/stitch-sdk'

```bash
# Reinstalar dependencias
pnpm install

# O limpiar caché y reinstalar
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Error: better-sqlite3 compila lentamente

`better-sqlite3` es una dependencia opcional para caché offline SQLite. Si no compila, el CLI usa automáticamente JSON como fallback.

```bash
# Opción 1: Usar pnpm (más rápido)
pnpm install -g stitch-mcp-cli

# Opción 2: Ignorar scripts de compilación
npm install -g stitch-mcp-cli --ignore-scripts
```

### Error: API key inválida

```bash
# Verificar configuración
stitch-mcp-cli auth --check

# Reconfigurar API key
stitch-mcp-cli auth --api-key <nueva-key>
```

### Error: EACCES permission denied

```bash
# Permisos del directorio de configuración
chmod 700 ~/.stitch-mcp-cli
chmod 600 ~/.stitch-mcp-cli/config.json
chmod 600 ~/.stitch-mcp-cli/.key
```

### MCP Server no aparece en mi IDE

1. Verifica que el binario esté instalado:

```bash
which stitch-mcp-cli
# Debe retornar: /usr/local/bin/stitch-mcp-cli o similar
```

2. Si usas pnpm global, agrega el path:

```bash
# Agregar a ~/.bashrc o ~/.zshrc
export PATH="$(pnpm global bin):$PATH"
```

3. Reinicia el IDE después de configurar

### Rate limiting (429 Too Many Requests)

El CLI tiene rate limiting interno de 60 req/min. Si ves este error:

- Espera 1 minuto antes de continuar
- Usa modo offline: `stitch-mcp-cli projects --offline`
- Aumenta el límite: `STITCH_RATE_LIMIT=120 stitch-mcp-cli mcp`

### Logs de depuración

```bash
# Activar logs detallados
LOG_LEVEL=debug stitch-mcp-cli mcp

# Guardar logs en archivo
LOG_LEVEL=debug stitch-mcp-cli mcp 2>&1 | tee stitch.log
```

## Licencia

MIT
