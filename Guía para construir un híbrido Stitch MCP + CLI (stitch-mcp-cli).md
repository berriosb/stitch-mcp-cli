# Guía para construir un CLI + MCP Proxy para Google Stitch

## Resumen Ejecutivo

Este documento describe cómo diseñar e implementar **stitch-mcp-cli**, un CLI de última generación que proporciona acceso a Google Stitch desde cualquier IDE/CLI compatible con MCP, con capacidades avanzadas de scaffolding multi-framework que no existen en soluciones existentes.

**Diferenciación clave respecto a `@_davideast/stitch-mcp`:**

| Aspecto | David East | stitch-mcp-cli |
|---------|-----------|---------------|
| Auth | OAuth + gcloud (5+ min) | API key (30 seg) |
| Scaffolding | Solo Astro | React, Vue, Svelte, Next.js, Nuxt, etc. |
| Offline | No | Caché local de proyectos |
| Watch mode | No | Sync continuo |
| Evaluaciones | No | Benchmark tools para LLMs |

---

## Conceptos Clave

### Google Stitch

Stitch es una plataforma de Google Labs que genera diseños de UI y código HTML/CSS/React a partir de prompts de texto, usando Gemini como backend.

**Flujo de trabajo:**
1. Diseñador crea diseño en https://stitch.withgoogle.com
2. Agente de IA usa MCP para acceder al diseño
3. CLI exporta el diseño a código del framework deseado

### MCP (Model Context Protocol)

Protocolo estándar para que clientes (editores/CLIs de IA) hablen con servidores que exponen herramientas. stitch-mcp-cli actúa como **MCP Proxy**, reenviando requests al servidor oficial de Google.

### Arquitectura CLI vs MCP Proxy

```
┌─────────────────────────────────────────────────────────────────┐
│                        IDE / Coding Agent                        │
│   (Cursor, Claude Code, OpenCode, Antigravity, Codex CLI)        │
└───────────────────────────────┬─────────────────────────────────┘
                                 │ MCP (JSON-RPC over stdio)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     stitch-mcp-cli                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │ MCP Proxy       │  │ CLI Commands    │  │ Template       │ │
│  │ (StitchProxy)   │  │ (Commander)    │  │ Engine         │ │
│  └─────────────────┘  └─────────────────┘  └────────────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│           Remote MCP Server (Stitch Official)                    │
│           https://stitch.googleapis.com/mcp                       │
│           (Autenticación: X-Goog-Api-Key header)                │
└─────────────────────────────────────────────────────────────────┘
```

**Nota**: Stitch es un **Remote MCP Server** (no local). Se conecta via HTTP a `https://stitch.googleapis.com/mcp` usando API Key en el header `X-Goog-Api-Key`.

---

## Implementación Paso a Paso

### 1. Inicialización del Proyecto

El proyecto soporta **npm**, **pnpm** y **yarn**:

```bash
mkdir stitch-mcp-cli && cd stitch-mcp-cli

# npm (default)
npm init -y
npm install @google/stitch-sdk @modelcontextprotocol/sdk commander zod dotenv
npm install --save-dev typescript @types/node tsx vitest
npx tsc --init

# pnpm (recomendado - genera pnpm-lock.yaml)
pnpm init
pnpm add @google/stitch-sdk @modelcontextprotocol/sdk commander zod dotenv
pnpm add -D typescript @types/node tsx vitest
pnpm exec tsc --init

# yarn
yarn init
yarn add @google/stitch-sdk @modelcontextprotocol/sdk commander zod dotenv
yarn add -D typescript @types/node tsx vitest
yarn tsc --init
```

### 2. MCP Proxy (src/index.ts)

El proxy es el punto de entrada cuando se usa como servidor MCP:

```typescript
#!/usr/bin/env node
import { StitchProxy } from "@google/stitch-sdk";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const apiKey = process.env.STITCH_API_KEY;

if (!apiKey) {
  console.error("Error: STITCH_API_KEY not configured");
  console.error("Run: stitch-mcp-cli auth --api-key <your-key>");
  process.exit(1);
}

const proxy = new StitchProxy({ apiKey });
const transport = new StdioServerTransport();

await proxy.start(transport);
```

### 3. CLI Entry Point (src/bin/cli.ts)

```typescript
#!/usr/bin/env node
import { Command } from "commander";
import { auth } from "../commands/auth.js";
import { setup } from "../commands/setup.js";
import { projects } from "../commands/projects.js";
import { generate } from "../commands/generate.js";
import { sync } from "../commands/sync.js";
import { exportCmd } from "../commands/export.js";
import { watch } from "../commands/watch.js";
import { cache } from "../commands/cache.js";
import { evalCmd } from "../commands/eval.js";

const program = new Command();

program
  .name("stitch-mcp-cli")
  .description("CLI + MCP proxy for Google Stitch with multi-framework scaffolding")
  .version("0.1.0");

program.command("auth").description("Configure API key").action(auth);
program.command("setup").description("Setup IDEs").action(setup);
program.command("projects").description("List projects").action(projects);
program.command("generate").description("Generate screen").action(generate);
program.command("sync").description("Sync to files").action(sync);
program.command("export").description("Export to framework").action(exportCmd);
program.command("watch").description("Watch mode").action(watch);
program.command("cache").description("Manage cache").action(cache);
program.command("eval").description("Run evaluations").action(evalCmd);

program.parse();
```

### Seguridad de API Keys

**IMPORTANTE**: Sigue estas prácticas de seguridad de Google Cloud:

1. **NUNCA** incluir API keys en código
2. **NUNCA** subir keys al repositorio
3. El SDK usa **header HTTP** `x-goog-api-key`, no query params
4. Añade **restricciones** a la key en Google Cloud Console
5. **Rota** la key cada 90 días
6. **Monitoriza** el uso en Cloud Logging

#### Configuración Segura

```bash
# La API key se guarda en ~/.stitch-mcp-cli/config.json
# El directorio ~/.stitch-mcp-cli está en .gitignore (directorio home)
# NUNCA subas este archivo a git
```

#### Restricciones Recomendadas (GCP Console)

1. Ve a Google Cloud Console > APIs & Services > Credentials
2. Edita tu API key de Stitch
3. En "API restrictions": selecciona solo Stitch API
4. En "Application restrictions": configura según necesidad

---

### Configuración de IDEs con API Key

#### Cursor
```json
{
  "mcpServers": {
    "stitch": {
      "url": "https://stitch.googleapis.com/mcp",
      "headers": {
        "X-Goog-Api-Key": "YOUR-API-KEY"
      }
    }
  }
}
```

#### VSCode
```json
{
  "servers": {
    "stitch": {
      "url": "https://stitch.googleapis.com/mcp",
      "type": "http",
      "headers": {
        "Accept": "application/json",
        "X-Goog-Api-Key": "YOUR-API-KEY"
      }
    }
  }
}
```

#### Claude Code
```bash
claude mcp add stitch --transport http https://stitch.googleapis.com/mcp --header "X-Goog-Api-Key: api-key" -s user
```

#### Antigravity
```json
{
  "mcpServers": {
    "stitch": {
      "serverUrl": "https://stitch.googleapis.com/mcp",
      "headers": {
        "X-Goog-Api-Key": "YOUR-API-KEY"
      }
    }
  }
}
```

#### Gemini CLI
```bash
gemini extensions install https://github.com/gemini-cli-extensions/stitch
```

---

### 4. Auth Command (src/commands/auth.ts)

```typescript
import fs from "fs";
import path from "path";
import os from "os";
import { StitchToolClient } from "@google/stitch-sdk";

const CONFIG_DIR = path.join(os.homedir(), ".stitch-mcp-cli");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

interface Config {
  apiKey?: string;
}

function loadConfig(): Config {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function auth(options: { apiKey?: string; check?: boolean }) {
  if (options.check) {
    const config = loadConfig();
    if (!config.apiKey) {
      console.log("❌ API key not configured");
      process.exit(1);
    }

    try {
      const client = new StitchToolClient({ apiKey: config.apiKey });
      await client.listTools();
      console.log("✅ API key configured and valid");
      await client.close();
    } catch {
      console.log("❌ API key is invalid");
      process.exit(1);
    }
    return;
  }

  if (!options.apiKey) {
    console.error("Usage: stitch-mcp-cli auth --api-key <key>");
    process.exit(1);
  }

  saveConfig({ apiKey: options.apiKey });
  console.log("✅ API key saved to ~/.stitch-mcp-cli/config.json");
}
```

### 5. Setup Multi-Editor (src/commands/setup.ts)

```typescript
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

interface Editor {
  name: string;
  cmd: string;
  configPath: string;
  format: "json" | "toml";
}

const EDITORS: Editor[] = [
  { name: "Cursor", cmd: "cursor", configPath: ".cursor/mcp.json", format: "json" },
  { name: "Claude Code", cmd: "claude", configPath: ".claude/claude_desktop_config.json", format: "json" },
  { name: "VS Code", cmd: "code", configPath: ".config/Code/User/global.json", format: "json" },
  { name: "OpenCode", cmd: "opencode", configPath: ".config/opencode/opencode.json", format: "json" },
  { name: "Kilo Code", cmd: "kilo", configPath: ".config/opencode/opencode.json", format: "json" },
  { name: "Antigravity", cmd: "antigravity", configPath: ".antigravity/mcp_config.json", format: "json" },
  { name: "Codex CLI", cmd: "codex", configPath: ".codex/config.toml", format: "toml" },
];

function detectEditors(): Editor[] {
  return EDITORS.filter((editor) => {
    try {
      execSync(`${editor.cmd} --version`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  });
}

export async function setup(options: { editor?: string; verbose?: boolean }) {
  const detected = detectEditors();

  if (detected.length === 0) {
    console.log("No compatible IDEs detected.");
    console.log("Manually add stitch-mcp-cli to your MCP config.");
    return;
  }

  const targetEditors = options.editor
    ? detected.filter((e) => e.name.toLowerCase() === options.editor.toLowerCase())
    : detected;

  for (const editor of targetEditors) {
    const configPath = path.join(os.homedir(), editor.configPath);
    const configDir = path.dirname(configPath);

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    let config: string;
    if (editor.format === "toml") {
      config = `\n[[mcp_servers.stitch]]\ncommand = "npx"\nargs = ["stitch-mcp-cli"]\n`;
    } else {
      config = JSON.stringify({
        mcpServers: {
          stitch: {
            command: "npx",
            args: ["stitch-mcp-cli"],
            env: { STITCH_API_KEY: "${STITCH_API_KEY}" },
          },
        },
      }, null, 2);
    }

    fs.writeFileSync(configPath, config);
    console.log(options.verbose ? `✅ ${editor.name}: ${configPath}` : `✅ ${editor.name}`);
  }

  console.log(`\nConfigured ${targetEditors.length} IDE(s)`);
  console.log("\nNext steps:");
  console.log("1. Run: stitch-mcp-cli auth --api-key <your-key>");
  console.log("2. Restart your IDE");
}
```

### 6. Generate Command (src/commands/generate.ts)

```typescript
import { stitch } from "@google/stitch-sdk";

export async function generate(
  prompt: string,
  options: { projectId?: string; device?: "mobile" | "desktop" | "tablet" }
) {
  if (!prompt) {
    console.error("Error: prompt required");
    process.exit(1);
  }

  try {
    let project;

    if (options.projectId) {
      project = stitch.project(options.projectId);
    } else {
      const projects = await stitch.projects();
      if (projects.length === 0) {
        console.error("No projects. Create one at stitch.withgoogle.com");
        process.exit(1);
      }
      project = projects[0];
      console.log(`Using project: ${project.id}`);
    }

    console.log("Generating screen...");
    const screen = await project.generate(prompt, {
      deviceType: options.device?.toUpperCase() as any,
    });

    console.log(`\n✅ Screen generated: ${screen.id}`);
    console.log(`   Project ID: ${screen.projectId}`);
    console.log(`   Screen ID: ${screen.screenId}`);
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
```

### 7. Template Engine (src/lib/template-engine.ts)

```typescript
interface TransformOptions {
  framework: "react" | "vue" | "svelte" | "nextjs" | "vanilla";
  componentName: string;
  html: string;
  css?: string;
}

export async function transformToFramework(options: TransformOptions): Promise<string> {
  const { framework, componentName, html, css } = options;

  switch (framework) {
    case "react":
      return transformToReact(componentName, html, css);
    case "vue":
      return transformToVue(componentName, html, css);
    case "svelte":
      return transformToSvelte(componentName, html, css);
    case "nextjs":
      return transformToNextjs(componentName, html, css);
    default:
      return html;
  }
}

function transformToReact(name: string, html: string, css?: string): string {
  return `import React from 'react';

export function ${name}() {
  return (
    <div className="${name.toLowerCase()}">
      <style>{${JSON.stringify(css || "")}}</style>
      ${htmlToJsx(html)}
    </div>
  );
}
`;
}

function transformToVue(name: string, html: string, css?: string): string {
  return `<template>
  <div class="${name.toLowerCase()}">
    <style>${css || ""}</style>
    ${html}
  </div>
</template>

<script setup lang="ts">
// Component: ${name}
</script>
`;
}

function transformToSvelte(name: string, html: string, css?: string): string {
  return `<script setup lang="ts">
// Component: ${name}
</script>

<style>
${css || ""}
</style>

<div class="${name.toLowerCase()}">
  ${html}
</div>
`;
}

function transformToNextjs(name: string, html: string, css?: string): string {
  return `export default function ${name}() {
  return (
    <div className="${name.toLowerCase()}">
      <style jsx>{${JSON.stringify(css || "")}}</style>
      ${htmlToJsx(html)}
    </div>
  );
}
`;
}

function htmlToJsx(html: string): string {
  return html
    .replace(/class=/g, "className=")
    .replace(/for=/g, "htmlFor=");
}
```

### 8. Export Command (src/commands/export.ts)

```typescript
import fs from "fs";
import path from "path";
import { stitch } from "@google/stitch-sdk";
import { transformToFramework } from "../lib/template-engine.js";

export async function exportCmd(
  projectId: string,
  options: { framework: string; output: string; routes?: string }
) {
  if (!projectId) {
    console.error("Usage: stitch-mcp-cli export <project-id> --framework react --output ./components");
    process.exit(1);
  }

  const project = stitch.project(projectId);
  const screens = await project.screens();

  const outputDir = options.output || "./stitch-export";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const framework = (options.framework || "react").toLowerCase() as any;

  for (const screen of screens) {
    const html = await screen.getHtml();
    const componentName = `Screen${screen.id.slice(0, 8)}`;
    const code = await transformToFramework({ framework, componentName, html });

    const ext = framework === "react" || framework === "nextjs" ? "tsx" : "vue";
    fs.writeFileSync(path.join(outputDir, `${componentName}.${ext}`), code);
  }

  console.log(`✅ Exported ${screens.length} screens to ${outputDir}`);
  console.log(`   Framework: ${framework}`);
}
```

### 9. Watch Mode (src/commands/watch.ts)

```typescript
import { stitch } from "@google/stitch-sdk";
import { transformToFramework } from "../lib/template-engine.js";
import fs from "fs";
import path from "path";

export async function watch(
  projectId: string,
  options: { output: string; framework?: string }
) {
  if (!projectId) {
    console.error("Usage: stitch-mcp-cli watch <project-id> --output ./src");
    process.exit(1);
  }

  console.log(`👀 Watching project ${projectId} for changes...`);
  console.log(`   Output: ${options.output}`);
  console.log(`   Press Ctrl+C to stop`);

  const project = stitch.project(projectId);
  const framework = (options.framework || "react").toLowerCase() as any;

  let lastScreenCount = 0;

  setInterval(async () => {
    try {
      const screens = await project.screens();
      
      if (screens.length !== lastScreenCount) {
        console.log(`\n📱 ${screens.length} screens detected`);
        lastScreenCount = screens.length;

        for (const screen of screens) {
          const html = await screen.getHtml();
          const componentName = `Screen${screen.id.slice(0, 8)}`;
          const code = await transformToFramework({ framework, componentName, html });

          const ext = framework === "react" || framework === "nextjs" ? "tsx" : "vue";
          const filePath = path.join(options.output, `${componentName}.${ext}`);
          fs.writeFileSync(filePath, code);
        }

        console.log(`✅ Synced ${screens.length} screens`);
      }
    } catch (error) {
      console.error("Watch error:", error instanceof Error ? error.message : error);
    }
  }, 5000);

  process.on("SIGINT", () => {
    console.log("\n\n👋 Stopped watching");
    process.exit(0);
  });
}
```

---

## Mejores Prácticas

### Validación de Input

```typescript
import { z } from "zod";

const GenerateSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
  projectId: z.string().optional(),
  device: z.enum(["mobile", "desktop", "tablet"]).optional(),
});

export async function generateRaw(args: unknown) {
  const { prompt, projectId, device } = GenerateSchema.parse(args);
  // Use validated args
}
```

### Manejo de Errores

```typescript
import { StitchError } from "@google/stitch-sdk";

try {
  await operation();
} catch (error) {
  if (error instanceof StitchError) {
    switch (error.code) {
      case "AUTH_FAILED":
        console.error("Auth failed. Run: stitch-mcp-cli auth --api-key <key>");
        break;
      case "NOT_FOUND":
        console.error("Project not found");
        break;
      case "RATE_LIMITED":
        console.error("Rate limited. Wait and try again.");
        break;
      default:
        console.error(`Error: ${error.message}`);
    }
  }
  process.exit(1);
}
```

### Configuración Multi-IDE

| IDE | Config Path | Format |
|-----|-------------|--------|
| Cursor | `~/.cursor/mcp.json` | JSON |
| Claude Code | `~/.claude/claude_desktop_config.json` | JSON |
| VS Code | `~/.config/Code/User/global.json` | JSON |
| OpenCode | `~/.config/opencode/opencode.json` | JSON |
| Kilo Code | `~/.config/opencode/opencode.json` | JSON |
| Antigravity | `~/.antigravity/mcp_config.json` | JSON |
| Codex CLI | `~/.codex/config.toml` | TOML |

#### OpenCode / Kilo Code
```json
{
  "mcpServers": {
    "stitch": {
      "url": "https://stitch.googleapis.com/mcp",
      "headers": {
        "X-Goog-Api-Key": "YOUR-API-KEY"
      }
    }
  }
}
```

#### Codex CLI
```toml
[[mcp_servers.stitch]]
command = "npx"
args = ["stitch-mcp-cli"]
env = { STITCH_API_KEY = "YOUR-API-KEY" }
```

---

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm test -- --coverage
```

---

## Herramientas MCP Disponibles

El servidor Stitch MCP expone **14 herramientas** categorizadas:

### Project Management
| Tool | Read-Only |
|------|-----------|
| `create_project` | No |
| `get_project` | Yes |
| `delete_project` | No |
| `list_projects` | Yes |

### Screen Management
| Tool | Read-Only |
|------|-----------|
| `list_screens` | Yes |
| `get_screen` | Yes |

### AI Generation
| Tool | Read-Only |
|------|-----------|
| `generate_screen_from_text` | No |
| `upload_screens_from_images` | No |
| `edit_screens` | No |
| `generate_variants` | No |

### Design Systems
| Tool | Read-Only |
|------|-----------|
| `create_design_system` | No |
| `update_design_system` | No |
| `list_design_systems` | Yes |
| `apply_design_system` | No |

### Notas Importantes

- **`generate_screen_from_text`**: Tarda ~2-3 minutos. No reintentar en errores de conexión. Usar `get_screen` después para verificar.
- **`generate_variants`**: Soporta 1-5 variantes con aspectos: `LAYOUT`, `COLOR_SCHEME`, `IMAGES`, `TEXT_FONT`, `TEXT_CONTENT`
- **Modelos**: `GEMINI_3_PRO`, `GEMINI_3_FLASH`
- **Device types**: `MOBILE`, `DESKTOP`, `TABLET`, `AGNOSTIC`
- **Fonts**: 29 fonts (INTER, ROBOTO, DM_SANS, GEIST, SORA, MANROPE, etc.)

---

## Referencias

- [SDK Oficial](https://github.com/google-labs-code/stitch-sdk)
- [CLI David East](https://github.com/davideast/stitch-mcp)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Codelab Antigravity](https://codelabs.developers.google.com/design-to-code-with-antigravity-stitch)
- [Blog Stitch](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/)
- [Stitch MCP Setup](https://stitch.withgoogle.com/docs/mcp/setup)