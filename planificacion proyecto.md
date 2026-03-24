# Plan de Implementación - stitch-mcp-cli

## Análisis Competitivo

| Feature | @_davideast/stitch-mcp | **stitch-mcp-cli (este)** |
|---------|------------------------|---------------------------|
| Auth | OAuth + gcloud (complejo) | **Solo API key (simple)** |
| Scaffolding | Solo Astro | **Multi-framework** (React, Vue, Svelte, Next.js, Nuxt, etc.) |
| Watch mode | No | **Sync continuo en tiempo real** |
| Offline cache | No | **Proyectos cacheados localmente** |
| Evaluaciones MCP | No | **Benchmark tools para LLMs** |
| Template system | No | **Templates personalizables** |
| Export integrations | No | **Vercel, Cloudflare, Netlify** |
| Idioma docs | Inglés | **Español + Inglés** |

---

## Visión del Proyecto

**stitch-mcp-cli** es un CLI de última generación que cierra la brecha entre Google Stitch y cualquier entorno de desarrollo. Mientras que el CLI de David East existe y funciona, tiene una fricción de setup alta (OAuth, gcloud) y está limitado a Astro para scaffolding.

Nuestro proyecto ofrece:
1. **Setup en 30 segundos** - Solo necesitas una API key
2. **Scaffolding universal** - Exporta a React, Vue, Svelte, Next.js, o lo que quieras
3. **Workflow completo** - Desde el diseño en Stitch hasta producción

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────────────────┐
│                         stitch-mcp-cli                                │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ MCP Proxy   │  │ CLI Engine   │  │ Template Engine          │   │
│  │ (StitchProxy)│  │ (Commander)  │  │ (EJS + Transformers)     │   │
│  └─────────────┘  └──────────────┘  └──────────────────────────┘   │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Auth Module │  │ Cache System │  │ Evaluation Runner        │   │
│  │ (API Key)   │  │ (SQLite/FS)  │  │ (MCP Benchmark)          │   │
│  └─────────────┘  └──────────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    @google/stitch-sdk                                 │
│                    (Google Labs Official)                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Stack Técnico

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| Lenguaje | TypeScript | Tipado estático, mejor DX |
| Runtime | Node.js 18+ | Compatibilidad universal |
| CLI | Commander.js | Simple, bien mantenido |
| Validación | Zod | Esquemas tipados |
| Testing | Vitest | Rápido, buen soporte TS |
| Caché | better-sqlite3 | SQLite embebido, sin servidor |
| Templates | EJS | Simple, ampliamente usado |
| HTTP Client | Built-in fetch | Node 18+ nativo |
| Package Manager | npm/pnpm/yarn | Soporte multiplataforma |

### Soporte Multi-Package Manager

El proyecto soporta oficialmente **npm**, **pnpm** y **yarn**:

```bash
# npm
npm install

# pnpm (recomendado - más rápido y eficiente en espacio)
pnpm install

# yarn
yarn install
```

El lock file correspondiente se genera automáticamente:
- `package-lock.json` para npm
- `pnpm-lock.yaml` para pnpm
- `yarn.lock` para yarn

---

## Estructura del Proyecto

```
stitch-mcp-cli/
├── src/
│   ├── index.ts                 # MCP Proxy entry (StitchProxy)
│   ├── bin/
│   │   └── cli.ts               # CLI entry point
│   ├── commands/
│   │   ├── setup.ts             # Configurar IDEs
│   │   ├── auth.ts              # Gestionar API key
│   │   ├── projects.ts          # Listar proyectos
│   │   ├── generate.ts          # Generar pantalla
│   │   ├── sync.ts              # Sync a archivos
│   │   ├── watch.ts             # Watch mode
│   │   ├── export.ts            # Export a framework
│   │   ├── cache.ts             # Gestionar caché
│   │   └── eval.ts              # Evaluaciones MCP
│   ├── lib/
│   │   ├── stitch-client.ts     # Wrapper SDK
│   │   ├── setup-multi.ts       # Config multi-IDE
│   │   ├── template-engine.ts   # Motor de templates
│   │   ├── cache-manager.ts     # Caché SQLite
│   │   └── framework-mapper.ts  # Mapeo a frameworks
│   ├── templates/
│   │   ├── react/               # Template React
│   │   ├── vue/                 # Template Vue
│   │   ├── svelte/              # Template Svelte
│   │   ├── nextjs/              # Template Next.js
│   │   └── vanilla/             # Template HTML/CSS puro
│   └── types/
│       └── index.ts              # Tipos compartidos
├── tests/
│   ├── unit/
│   └── integration/
├── evaluations/
│   └── stitch-mcp-eval.xml      # 10 preguntas de evaluación
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## Comandos CLI (v0.1.0 MVP)

### `stitch-mcp-cli auth`
```bash
# Configurar API key interactivamente
stitch-mcp-cli auth

# Configurar API key directamente
stitch-mcp-cli auth --api-key <key>

# Verificar configuración
stitch-mcp-cli auth --check
```

### `stitch-mcp-cli setup`
```bash
# Auto-detectar y configurar IDEs
stitch-mcp-cli setup

# Configurar solo IDE específico
stitch-mcp-cli setup --editor cursor

# Modo verbose
stitch-mcp-cli setup --verbose
```

### `stitch-mcp-cli projects`
```bash
# Listar todos los proyectos
stitch-mcp-cli projects

# Listar con formato JSON
stitch-mcp-cli projects --json

# Filtrar por nombre
stitch-mcp-cli projects --search "dashboard"
```

### `stitch-mcp-cli generate`
```bash
# Generar pantalla desde prompt
stitch-mcp-cli generate "Login form with email and password" --project-id <id>

# Generar con tipo de dispositivo
stitch-mcp-cli generate "Mobile navigation" --project-id <id> --device mobile
```

### `stitch-mcp-cli sync`
```bash
# Sync pantalla específica
stitch-mcp-cli sync <project-id> <screen-id> --output ./src/stitch

# Sync todos los diseños de un proyecto
stitch-mcp-cli sync --project-id <id> --output ./designs
```

### `stitch-mcp-cli export`
```bash
# Exportar a React
stitch-mcp-cli export <project-id> --framework react --output ./src/components

# Exportar a Vue
stitch-mcp-cli export <project-id> --framework vue --output ./src/views

# Exportar a Next.js con routing
stitch-mcp-cli export <project-id> --framework nextjs --output ./app --routes "/,/about,/contact"
```

### `stitch-mcp-cli watch`
```bash
# Modo watch con sync automático
stitch-mcp-cli watch <project-id> --output ./src/stitch

# Watch con framework específico
stitch-mcp-cli watch <project-id> --framework react --output ./src
```

### `stitch-mcp-cli cache`
```bash
# Ver estado de caché
stitch-mcp-cli cache --status

# Limpiar caché
stitch-mcp-cli cache --clear

# Sync from cache (offline)
stitch-mcp-cli cache --sync <project-id>
```

### `stitch-mcp-cli eval`
```bash
# Ejecutar evaluación completa
stitch-mcp-cli eval

# Ejecutar evaluación específica
stitch-mcp-cli eval --file ./evaluations/custom-eval.xml

# Ver resultados
stitch-mcp-cli eval --results
```

---

## Fase 1: Proyecto Base

### 1.1 Inicializar Proyecto

```bash
# Usando npm (default)
npm init -y
npm install @google/stitch-sdk @modelcontextprotocol/sdk commander zod dotenv
npm install --save-dev typescript @types/node tsx vitest
npx tsc --init

# Usando pnpm (recomendado - genera pnpm-lock.yaml)
pnpm init
pnpm add @google/stitch-sdk @modelcontextprotocol/sdk commander zod dotenv
pnpm add -D typescript @types/node tsx vitest
pnpm exec tsc --init

# Usando yarn
yarn init
yarn add @google/stitch-sdk @modelcontextprotocol/sdk commander zod dotenv
yarn add -D typescript @types/node tsx vitest
yarn tsc --init
```

### 1.2 package.json

```json
{
  "name": "stitch-mcp-cli",
  "version": "0.1.0",
  "description": "CLI + MCP proxy para Google Stitch con scaffolding multi-framework",
  "type": "module",
  "bin": {
    "stitch-mcp-cli": "./dist/bin/cli.js"
  },
  "scripts": {
    "dev": "tsx watch src/bin/cli.ts",
    "build": "tsc",
    "test": "vitest",
    "lint": "tsc --noEmit",
    "typecheck": "tsc --noEmit"
  },
  "engines": { "node": ">=18" }
}
```

### 1.3 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## Fase 2: MCP Proxy (src/index.ts)

```typescript
#!/usr/bin/env node
import { StitchProxy } from "@google/stitch-sdk";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const apiKey = process.env.STITCH_API_KEY;

if (!apiKey) {
  console.error("Error: STITCH_API_KEY no está configurada.");
  console.error("Ejecuta: stitch-mcp-cli auth --api-key <tu-api-key>");
  process.exit(1);
}

const proxy = new StitchProxy({ apiKey });
const transport = new StdioServerTransport();

await proxy.start(transport);
console.error("Stitch MCP Proxy iniciado");
```

---

## Fase 3: CLI Base (src/bin/cli.ts)

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
  .description("CLI + MCP proxy para Google Stitch")
  .version("0.1.0");

program.command("auth").description("Configurar API key").action(auth);
program.command("setup").description("Configurar IDEs").action(setup);
program.command("projects").description("Listar proyectos").action(projects);
program.command("generate").description("Generar pantalla").action(generate);
program.command("sync").description("Sync a archivos").action(sync);
program.command("export").description("Exportar a framework").action(exportCmd);
program.command("watch").description("Watch mode").action(watch);
program.command("cache").description("Gestionar caché").action(cache);
program.command("eval").description("Ejecutar evaluaciones").action(evalCmd);

program.parse();
```

---

## Fase 4: Comandos

### 4.1 Auth (src/commands/auth.ts)

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

export async function auth(options: { apiKey?: string; check?: boolean }) {
  if (options.check) {
    const config = loadConfig();
    if (config.apiKey) {
      console.log("✅ API key configurada");
      
      try {
        const client = new StitchToolClient({ apiKey: config.apiKey });
        await client.listTools();
        console.log("✅ API key válida");
        await client.close();
      } catch {
        console.log("❌ API key inválida");
        process.exit(1);
      }
    } else {
      console.log("❌ API key no configurada");
      process.exit(1);
    }
    return;
  }

  if (!options.apiKey) {
    console.error("Usage: stitch-mcp-cli auth --api-key <key>");
    process.exit(1);
  }

  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  const config: Config = { apiKey: options.apiKey };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  
  console.log("✅ API key guardada en ~/.stitch-mcp-cli/config.json");
}

function loadConfig(): Config {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return {};
  }
}
```

### 4.2 Setup Multi-Editor (src/commands/setup.ts)

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

function getMcpConfig(editor: Editor): string {
  const mcpEntry = {
    command: "npx",
    args: ["stitch-mcp-cli"],
    env: {
      STITCH_API_KEY: "${STITCH_API_KEY}",
    },
  };

  if (editor.format === "toml") {
    return `\n[[mcp_servers.stitch]]\ncommand = "npx"\nargs = ["stitch-mcp-cli"]\n`;
  }

  return JSON.stringify({ mcpServers: { stitch: mcpEntry } }, null, 2);
}

export async function setup(options: { editor?: string; verbose?: boolean }) {
  const detected = detectEditors();
  
  if (detected.length === 0) {
    console.log("No se detectaron IDEs compatibles instalados.");
    console.log("Puedes configurar manualmente agregando stitch-mcp-cli a tu config MCP.");
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

    const config = getMcpConfig(editor);
    fs.writeFileSync(configPath, config);

    if (options.verbose) {
      console.log(`✅ ${editor.name}: ${configPath}`);
    } else {
      console.log(`✅ ${editor.name}`);
    }
  }

  console.log(`\nConfigurado en ${targetEditors.length} IDE(s)`);
  console.log("\nPróximos pasos:");
  console.log("1. Ejecuta: stitch-mcp-cli auth --api-key <tu-key>");
  console.log("2. Reinicia tu IDE");
  console.log("3. El servidor MCP se iniciará automáticamente");
}
```

### 4.3 Projects (src/commands/projects.ts)

```typescript
import { stitch } from "@google/stitch-sdk";

export async function projects(options: { json?: boolean; search?: string }) {
  try {
    const allProjects = await stitch.projects();
    
    let filtered = allProjects;
    if (options.search) {
      const search = options.search.toLowerCase();
      filtered = allProjects.filter((p) => 
        p.id.toLowerCase().includes(search)
      );
    }

    if (options.json) {
      console.log(JSON.stringify(filtered, null, 2));
      return;
    }

    if (filtered.length === 0) {
      console.log("No hay proyectos.");
      return;
    }

    console.log(`Proyectos (${filtered.length}):\n`);
    for (const project of filtered) {
      console.log(`  ${project.id}`);
      console.log(`  ${project.projectId}\n`);
    }
  } catch (error) {
    console.error("Error al obtener proyectos:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
```

### 4.4 Generate (src/commands/generate.ts)

```typescript
import { stitch } from "@google/stitch-sdk";

export async function generate(
  prompt: string,
  options: { projectId?: string; device?: "mobile" | "desktop" | "tablet" }
) {
  if (!prompt) {
    console.error("Error: prompt requerido");
    console.error("Usage: stitch-mcp-cli generate <prompt> [--project-id <id>]");
    process.exit(1);
  }

  try {
    let project;

    if (options.projectId) {
      project = stitch.project(options.projectId);
    } else {
      const projects = await stitch.projects();
      if (projects.length === 0) {
        console.error("No hay proyectos. Crea uno primero en stitch.withgoogle.com");
        process.exit(1);
      }
      project = projects[0];
      console.log(`Usando proyecto: ${project.id}`);
    }

    console.log("Generando pantalla...");
    const screen = await project.generate(prompt, { deviceType: options.device?.toUpperCase() as any });

    console.log(`\n✅ Pantalla generada: ${screen.id}`);
    console.log(`   Project ID: ${screen.projectId}`);
    console.log(`   Screen ID: ${screen.screenId}`);
  } catch (error) {
    console.error("Error al generar:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
```

---

## Fase 5: Template Engine (src/lib/template-engine.ts)

El template engine transforma el HTML de Stitch en código del framework destino.

```typescript
import ejs from "ejs";

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
    case "vanilla":
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
```

---

## Fase 6: Cache System (src/lib/cache-manager.ts)

```typescript
import fs from "fs";
import path from "path";
import os from "os";

interface CachedProject {
  id: string;
  projectId: string;
  screens: CachedScreen[];
  lastSync: string;
}

interface CachedScreen {
  id: string;
  html: string;
  css?: string;
  imageUrl?: string;
  lastSync: string;
}

const CACHE_DIR = path.join(os.homedir(), ".stitch-mcp-cli", "cache");

export class CacheManager {
  async getProject(projectId: string): Promise<CachedProject | null> {
    const cacheFile = path.join(CACHE_DIR, `${projectId}.json`);
    if (!fs.existsSync(cacheFile)) return null;
    return JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
  }

  async saveProject(project: CachedProject): Promise<void> {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    const cacheFile = path.join(CACHE_DIR, `${project.id}.json`);
    fs.writeFileSync(cacheFile, JSON.stringify(project, null, 2));
  }

  async clearCache(): Promise<void> {
    if (fs.existsSync(CACHE_DIR)) {
      fs.rmSync(CACHE_DIR, { recursive: true });
    }
  }
}
```

---

## Fase 7: Evaluaciones (evaluations/stitch-mcp-eval.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<evaluation>
  <name>Stitch MCP CLI Evaluation</name>
  <description>Evaluación de herramientas MCP para Google Stitch</description>
  
  <qa_pair>
    <question>Lista todos los proyectos de Stitch y muestra el ID y nombre de cada uno.</question>
    <answer>Lista de proyectos con IDs</answer>
  </qa_pair>

  <qa_pair>
    <question>Crea un nuevo proyecto llamado "Test Dashboard" y genera una pantalla con un dashboard que muestre 3 cards de estadísticas.</question>
    <answer>Proyecto creado con ID único y pantalla de dashboard generada</answer>
  </qa_pair>

  <qa_pair>
    <question>Dado el proyecto con ID [ID], lista todas sus pantallas y para cada una muestra el ID y la fecha de creación.</question>
    <answer>Lista de pantallas con IDs y fechas</answer>
  </qa_pair>

  <qa_pair>
    <question>Genera una pantalla con un formulario de login que tenga campos para email, password y un botón de "Iniciar sesión". El proyecto destino tiene ID [ID].</question>
    <answer>Pantalla generada con ID único conteniendo formulario de login</answer>
  </qa_pair>

  <qa_pair>
    <question>Obtén el HTML completo de la pantalla con ID [SCREEN_ID] del proyecto [PROJECT_ID].</question>
    <answer>Código HTML completo de la pantalla</answer>
  </qa_pair>

  <qa_pair>
    <question>Edita la pantalla [SCREEN_ID] para cambiar el color de fondo a azul oscuro.</question>
    <answer>Pantalla editada exitosamente con nuevo ID</answer>
  </qa_pair>

  <qa_pair>
    <question>Genera 3 variantes de la pantalla [SCREEN_ID] explorando diferentes esquemas de color.</question>
    <answer>3 variantes generadas con IDs únicos</answer>
  </qa_pair>

  <qa_pair>
    <question>Sincroniza todas las pantallas del proyecto [PROJECT_ID] a la carpeta local ./stitch-output.</question>
    <answer>Archivos guardados en ./stitch-output con estructura de carpetas</answer>
  </qa_pair>

  <qa_pair>
    <question>Exporta el proyecto [PROJECT_ID] a componentes React en la carpeta ./components.</question>
    <answer>Componentes React generados en ./components</answer>
  </qa_pair>

  <qa_pair>
    <question>Dado el proyecto [PROJECT_ID], ¿cuántas pantallas tiene y cuál fue la última vez que se actualizó?</question>
    <answer>Número de pantallas y timestamp de última actualización</answer>
  </qa_pair>
</evaluation>
```

---

## Fase 8: Testing

### 8.1 Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```

### 8.2 Ejemplo Test

```typescript
// tests/commands/auth.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

vi.mock("fs");

describe("auth command", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should save api key to config file", () => {
    const mockFs = vi.mocked(fs);
    mockFs.existsSync.mockReturnValue(false);
    mockFs.mkdirSync.mockReturnValue();
    mockFs.writeFileSync.mockReturnValue();

    // Test logic here
    expect(true).toBe(true);
  });
});
```

---

## Roadmap

### v0.1.0 - MVP ✅
- [x] MCP Proxy con StitchProxy
- [x] CLI con Commander
- [x] Auth con API key simple
- [x] Setup multi-editor
- [x] Projects list
- [x] Generate screen
- [x] Sync command
- [x] Export command
- [x] Watch mode
- [x] Cache command
- [x] Template engine
- [x] Config module (API key persistence)
- [x] Tests unitarios (14 tests)
- [x] README.md
- [x] Evaluations XML

### v0.2.0 - Scaffolding
- [ ] Export a más frameworks
- [ ] Template engine mejorado con EJS

### v0.3.0 - Workflow
- [ ] Watch mode con polling configurable
- [ ] Cache system con SQLite
- [ ] Offline mode

### v0.4.0 - Enterprise
- [ ] Integraciones deployment (Vercel, CF, Netlify)
- [ ] Template custom
- [ ] Command `eval` para benchmarks

---

## Variables de Entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `STITCH_API_KEY` | Sí | API key de Stitch (obtener en stitch.withgoogle.com/settings) |
| `STITCH_HOST` | No | Host del MCP server (default: https://stitch.googleapis.com/mcp) |

---

## Autenticación con API Key

### Obtener la API Key

1. Ve a tu **Stitch Settings page** (https://stitch.withgoogle.com/settings)
2. Scroll a la sección **API Keys**
3. Click en **"Create API Key"** para generar una nueva API key
4. Copia y guarda la key en un lugar seguro

### Cómo funciona la autenticación

Stitch usa un **Remote MCP Server** en `https://stitch.googleapis.com/mcp`. La API key se pasa mediante el header HTTP `X-Goog-Api-Key`.

### Configuración por IDE

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

## Seguridad de API Keys

### Prácticas Obligatorias (Google Cloud Best Practices)

1. **NUNCA incluir API keys en código fuente** - El SDK las lee de variables de entorno o archivo local
2. **NUNCA subir keys al repositorio** - El archivo `~/.stitch-mcp-cli/config.json` está en `.gitignore` implícito (directorio home)
3. **Usar header HTTP** - El SDK usa `x-goog-api-key` header, no query params
4. **Añadir restricciones** - En Google Cloud Console, restringir la key a solo Stitch API
5. **Rotar periódicamente** - Crear nueva key cada 90 días
6. **Monitorizar uso** - Revisar Cloud Logging por uso anómalo

### Archivo de Configuración

```
~/.stitch-mcp-cli/
└── config.json    # API key guardada localmente (NUNCA subir a git)
```

### Configuración de API Key en GCP (Opcional pero recomendado)

Para mayor seguridad, restrict la API key en Google Cloud Console:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Selecciona tu proyecto
3. Edita la clave de API de Stitch
4. Añade restricciones:
   - **APIs**: Solo `Stitch API` (stitch.googleapis.com)
   - **Aplicaciones**: Solo las que necesites
   - **IPs**: Opcional, deja vacío para cualquier IP

### Detección de Abuso

Si notas uso no autorizado:
1. Ve a Cloud Logging
2. Filtra por tu API key
3. Revisa IPs y patrones de uso

---

---

## Herramientas MCP Disponibles (14 tools)

El servidor Stitch MCP expone las siguientes herramientas categorizadas:

### Project Management
| Tool | Descripción | Solo Lectura |
|------|-------------|--------------|
| `create_project` | Crea un nuevo proyecto | No |
| `get_project` | Obtiene detalles de un proyecto específico | Sí |
| `delete_project` | Elimina un proyecto | No |
| `list_projects` | Lista todos los proyectos accesibles | Sí |

### Screen Management
| Tool | Descripción | Solo Lectura |
|------|-------------|--------------|
| `list_screens` | Lista todas las pantallas de un proyecto | Sí |
| `get_screen` | Obtiene detalles de una pantalla específica | Sí |

### AI Generation
| Tool | Descripción | Solo Lectura |
|------|-------------|--------------|
| `generate_screen_from_text` | Genera una nueva pantalla desde un prompt | No |
| `upload_screens_from_images` | Sube imágenes para crear pantallas | No |
| `edit_screens` | Edita pantallas existentes con prompts | No |
| `generate_variants` | Genera variantes de pantallas existentes | No |

### Design Systems
| Tool | Descripción | Solo Lectura |
|------|-------------|--------------|
| `create_design_system` | Crea un design system | No |
| `update_design_system` | Actualiza un design system | No |
| `list_design_systems` | Lista design systems | Sí |
| `apply_design_system` | Aplica un design system a pantallas | No |

### Detalles de generate_screen_from_text

**Importante**: Este proceso tarda unos minutos. **No reintentar en errores de conexión** - esperar y usar `get_screen` después.

**Parámetros:**
- `projectId` (requerido): ID del proyecto
- `prompt` (requerido): Descripción de la pantalla a generar
- `deviceType`: `MOBILE`, `DESKTOP`, `TABLET`, `AGNOSTIC`
- `modelId`: `GEMINI_3_PRO`, `GEMINI_3_FLASH`

### generate_variants

Permite generar 1-5 variantes de pantallas existentes.

**Parámetros:**
- `variantCount`: Número de variantes (1-5, default: 3)
- `creativeRange`: `REFINE` (sutil), `EXPLORE` (balanceado), `REIMAGINE` (radical)
- `aspects`: `LAYOUT`, `COLOR_SCHEME`, `IMAGES`, `TEXT_FONT`, `TEXT_CONTENT`

### Design Systems

Los design systems definen tokens de diseño (colores, tipografía, formas) que se aplican a todas las pantallas.

**Theme options:**
- `colorMode`: `LIGHT`, `DARK`
- `font`: 29 fonts soportadas (INTER, ROBOTO, DM_SANS, GEIST, SORA, MANROPE, etc.)
- `roundness`: `ROUND_FOUR`, `ROUND_EIGHT`, `ROUND_TWELVE`, `ROUND_FULL`

---

## Tipos Compartidos

### Screen
```typescript
interface Screen {
  name: string;                    // Resource name: projects/{project}/screens/{screen}
  id: string;                      // (Deprecated) Screen ID
  title: string;                   // Título de la pantalla
  prompt: string;                  // Prompt usado para generar
  screenshot: File;                 // Imagen de la pantalla
  htmlCode: File;                  // Código HTML
  figmaExport: File;               // Export para Figma
  designSystem: Asset;             // Design system usado
  theme: DesignTheme;              // Theme de generación
  deviceType: DeviceType;         // Tipo de dispositivo
  screenType: ScreenType;         // Tipo de pantalla
  width: string;                   // Ancho
  height: string;                  // Alto
  groupId: string;                // ID de grupo para variantes
  groupName: string;              // Nombre del grupo
  generatedBy: string;            // Identificador del generador
}
```

### DeviceType Enum
- `DEVICE_TYPE_UNSPECIFIED`
- `MOBILE`
- `DESKTOP`
- `TABLET`
- `AGNOSTIC`

### ModelId Enum
- `MODEL_ID_UNSPECIFIED`
- `GEMINI_3_PRO`
- `GEMINI_3_FLASH`

### ColorMode Enum
- `COLOR_MODE_UNSPECIFIED`
- `LIGHT`
- `DARK`

### Font Enum (29 families)
INTER, ROBOTO, DM_SANS, GEIST, SORA, MANROPE, LEXEND, EPILOGUE, BE_VIETNAM_PRO, PLUS_JAKARTA_SANS, PUBLIC_SANS, SPACE_GROTESK, SPLINE_SANS, WORK_SANS, MONTSERRAT, METROPOLIS, SOURCE_SANS_THREE, NUNITO_SANS, ARIMO, HANKEN_GROTESK, RUBIK, IBM_PLEX_SANS, NEWSREADER, NOTO_SERIF, DOMINE, LIBRE_CASLON_TEXT, EB_GARAMOND, LITERATA, SOURCE_SERIF_FOUR

---

## Referencias

- [SDK Oficial](https://github.com/google-labs-code/stitch-sdk)
- [CLI David East](https://github.com/davideast/stitch-mcp)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Codelab Antigravity](https://codelabs.developers.google.com/design-to-code-with-antigravity-stitch)
- [Stitch MCP Setup](https://stitch.withgoogle.com/docs/mcp/setup)