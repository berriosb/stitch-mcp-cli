# Guía para construir un híbrido Stitch MCP + CLI (stitch-mcp-cli)

## Resumen ejecutivo

Este documento explica cómo diseñar e implementar un proyecto híbrido **MCP + CLI** para Google Stitch, enfocado en el caso `stitch-mcp-cli` que se puede usar desde múltiples IDEs y CLIs (Cursor, Claude Code, OpenCode, Antigravity, VS Code, Codex, etc.). El objetivo es que un solo paquete proporcione: (1) un servidor MCP para que los agentes vean y usen Stitch como herramienta, y (2) un CLI para automatizar setup, sincronización de diseños y scaffolding de proyectos sin depender de un IDE concreto.[^1][^2][^3][^4][^5]

El enfoque híbrido reduce fricción para usuarios finales ("instala una vez, funciona en todos tus editores") y maximiza adoptabilidad, ya que MCP es el estándar para agentes y CLI sigue siendo la interfaz dominante para pipelines y desarrolladores avanzados.[^6][^7]

## Conceptos clave

### Stitch y Stitch MCP

Stitch es una herramienta de Google Labs que genera diseños de UI y código HTML/CSS/React a partir de prompts de texto, utilizando modelos Gemini como backend. Stitch MCP es el envoltorio que expone la API de Stitch como servidor MCP, de modo que agentes en editores (Claude Code, Cursor, Gemini CLI, Antigravity, etc.) puedan llamarlo como una herramienta más dentro de su contexto.[^8][^9][^4][^10][^11]

En la práctica, un agente puede recibir una instrucción como "diseña un dashboard de analytics", llamar al servidor Stitch MCP, obtener el diseño + código base, y luego refinarlo o integrarlo en un proyecto existente.[^4][^8]

### MCP (Model Context Protocol)

MCP es un protocolo estandarizado para que clientes (editores/CLIs de IA) hablen con servidores que exponen herramientas externas: APIs, bases de datos, sistemas de archivos, etc. Cada cliente tiene su propia forma de declarar servidores MCP, pero todos comparten la misma idea: un bloque de configuración que indica comando o URL del servidor, argumentos y variables de entorno.[^12][^5][^13][^6]

Ejemplos:

- **OpenCode** usa un bloque `mcp` en su archivo de configuración (`~/.config/opencode/opencode.json`) donde se define el tipo de servidor, comando y entorno.[^5]
- **Codex CLI** usa `~/.codex/config.toml` con una sección `[mcp_servers.<id>]` donde se define `command`, `args` y opcionalmente variables de entorno para el servidor.[^13]
- **Antigravity** usa un archivo `mcp_config.json` donde se define una entrada con `command` y `args` que referencia normalmente a un wrapper `npx` que ejecuta el servidor Stitch MCP publicado en npm.[^14]

### CLI vs MCP para agentes

La literatura reciente sobre MCP vs CLI distingue claramente los casos de uso:[^15][^7][^12]

- MCP es ideal para **interacción dentro de IDEs/editores**, donde el agente necesita acceso continuo y estructurado a herramientas (Stitch, Figma, APIs, etc.).
- CLI es ideal para **pipelines, scripting y tareas batch**, donde se necesitan comandos reproducibles (`sync`, `deploy`, etc.) que pueden integrarse en CI/CD o en terminales como OpenCode CLI, Codex CLI o Gemini CLI.

Los benchmarks muestran que MCP suele ser algo más eficiente en tokens y latencia para uso interactivo, mientras que CLI tiende a ser más flexible para automatización y scripting avanzado.[^12][^6]

El enfoque híbrido combina ambas ventajas en un solo paquete.

## Arquitectura propuesta de `stitch-mcp-cli`

### Componentes principales

Un proyecto híbrido Stitch MCP + CLI típicamente se compone de:

1. **Binario CLI** (`bin/cli.js`)
   - Define comandos como `setup`, `mcp`, `sync` usando un parser de CLI (por ejemplo, Commander en Node.js).
   - Llama a funciones de librería para configurar editores, lanzar el servidor MCP y sincronizar diseños.

2. **Servidor MCP** (`server/mcp-server.js`)
   - Implementa el servidor HTTP o STDIO que cumple el protocolo MCP.
   - Encapsula llamadas a la API de Stitch (por HTTP o SDK) para generar o leer diseños.

3. **Módulo de configuración multi-editor** (`lib/setup-multi.js`)
   - Detecta IDEs/CLIs instalados (Cursor, Claude Code, OpenCode, Antigravity, VS Code, Codex, etc.) ejecutando comandos como `cursor --version` o `claude --version`.
   - Escribe los archivos de configuración MCP correspondientes para cada cliente detectado, apuntando al servidor `stitch-mcp-cli` local o remoto.[^5][^13][^14]

4. **Módulo de sincronización/scaffolding** (`lib/sync.js`)
   - Implementa comandos tipo `sync <design-name>` que llaman a Stitch para obtener diseños/código y los guardan en el árbol de archivos del proyecto.
   - Opcionalmente aplica plantillas opinionadas (React/Next.js, etc.).

5. **Configuración de proyecto (package.json)**
   - Declara el binario CLI, dependencias y scripts de desarrollo.
   - Define palabras clave y metadata para SEO (npm + GitHub).

### Flujo de uso esperado

1. El usuario instala el paquete de forma global o local con npm.
2. Ejecuta `stitch-mcp-cli setup`, que:
   - Verifica credenciales/API key de Stitch.
   - Detecta los IDEs/CLIs instalados.
   - Escribe la configuración MCP en los archivos adecuados (OpenCode, Claude, Cursor, Antigravity, VS Code, Codex, etc.).[^13][^14][^5]
3. Ejecuta `stitch-mcp-cli mcp` para lanzar el servidor MCP.
4. Desde el IDE, el agente ya ve "Stitch" como herramienta MCP y puede llamarla.
5. Opcionalmente, el usuario usa `stitch-mcp-cli sync "Nombre de diseño"` para bajar diseños/código de Stitch a su proyecto.

## Guía paso a paso de implementación

### 1. Preparar el repositorio y entorno

**Requisitos previos:**

- Node.js 18 o superior.[^3]
- Cuenta en Stitch (stitch.withgoogle.com) con al menos un proyecto.[^9]
- Cuenta en GitHub y npm para publicar el paquete.

**Pasos iniciales:**

1. Crear repositorio GitHub público, por ejemplo `berriosb/stitch-mcp-cli`.
2. Inicializar proyecto Node:
   - `npm init -y` o crear manualmente `package.json`.
   - Añadir `.gitignore` para Node (`node_modules`, etc.).

Ejemplo mínimo de `package.json` para un CLI híbrido:

```json
{
  "name": "stitch-mcp-cli",
  "version": "0.1.0",
  "description": "Universal Stitch MCP + CLI: auto-config multi-IDE + sync diseños → scaffolding de proyectos.",
  "main": "index.js",
  "bin": {
    "stitch-mcp-cli": "./bin/cli.js"
  },
  "scripts": {
    "start": "node bin/cli.js",
    "mcp": "node server/mcp-server.js"
  },
  "keywords": [
    "stitch",
    "mcp",
    "cli",
    "cursor",
    "claude",
    "opencode",
    "antigravity",
    "vscode",
    "codex"
  ],
  "license": "MIT"
}
```

### 2. Implementar el binario CLI

Para Node.js, es común usar `commander` o `yargs` para definir comandos.

Estructura básica de `bin/cli.js`:

```js
#!/usr/bin/env node

const { program } = require('commander');
const { setupMulti } = require('../lib/setup-multi');
const { startMCPServer } = require('../server/mcp-server');
const { syncDesign } = require('../lib/sync');

program
  .name('stitch-mcp-cli')
  .description('Universal Stitch MCP + CLI');

program
  .command('setup')
  .description('Auto-configurar MCP en IDEs/CLIs compatibles')
  .action(setupMulti);

program
  .command('mcp')
  .description('Lanzar servidor Stitch MCP local')
  .action(startMCPServer);

program
  .command('sync <designName>')
  .description('Sincronizar diseño de Stitch al proyecto actual')
  .option('--output <dir>', 'Directorio destino', 'src')
  .action((designName, options) => syncDesign(designName, options));

program.parse();
```

Este CLI expone tres comandos principales que cubren el flujo híbrido básico.

### 3. Implementar el módulo de configuración multi-editor

El objetivo de `setupMulti` es:

1. Detectar qué clientes MCP están instalados en la máquina (Cursor, Claude Code, OpenCode, Antigravity, VS Code, Codex, etc.).
2. Escribir la configuración MCP correspondiente apuntando al servidor `stitch-mcp-cli`.

Patrones de configuración de referencia:

- **Codex CLI** usa `~/.codex/config.toml` con bloques `[mcp_servers.<id>]` que definen el comando y argumentos para lanzar un servidor MCP STDIO o HTTP.[^13]
- **OpenCode** usa `~/.config/opencode/opencode.json` con un objeto `mcp` en el que cada servidor se define como `local` (con `command` y `environment`) o `remote` (con `url` y `headers`).[^5]
- **Antigravity** usa `mcp_config.json` donde se define un campo `command` y `args` que normalmente apuntan a un script `npx` que inicia el servidor Stitch MCP.[^14]

El módulo puede seguir este patrón genérico:

```js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const MCP_URL = 'http://localhost:3001';

const editors = [
  { name: 'cursor', cmd: 'cursor', path: path.join(os.homedir(), '.cursor', 'mcp.json'), type: 'json' },
  { name: 'claude', cmd: 'claude', path: path.join(os.homedir(), '.claude', 'claude_desktop_config.json'), type: 'json' },
  { name: 'opencode', cmd: 'opencode', path: path.join(os.homedir(), '.config', 'opencode', 'opencode.json'), type: 'json' },
  { name: 'antigravity', cmd: 'antigravity', path: path.join(os.homedir(), '.antigravity', 'mcp_config.json'), type: 'json' },
  { name: 'codex', cmd: 'codex', path: path.join(os.homedir(), '.codex', 'config.toml'), type: 'toml' }
  // Se pueden añadir Zed, VS Code, Trae, Kilo Code, etc.
];

function detectEditors() {
  return editors.filter(ed => {
    try {
      execSync(`${ed.cmd} --version`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  });
}

function writeConfig(ed, url) {
  const dir = path.dirname(ed.path);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (ed.type === 'toml') {
    // Codex: añadir bloque [mcp_servers.stitch]
    const tomlBlock = `\n[mcp_servers.stitch]\ncommand = "npx"\nargs = ["stitch-mcp-cli", "mcp"]\nstartup_timeout_sec = 20\n`;
    fs.appendFileSync(ed.path, tomlBlock);
  } else {
    // JSON: insertar/actualizar sección mcp.stitch
    let json = {};
    if (fs.existsSync(ed.path)) {
      try { json = JSON.parse(fs.readFileSync(ed.path, 'utf8')); } catch (e) {}
    }

    json.mcp = json.mcp || {};
    json.mcp.stitch = {
      type: 'local',
      command: ['npx', 'stitch-mcp-cli', 'mcp'],
      enabled: true,
      timeout: 5000
    };

    fs.writeFileSync(ed.path, JSON.stringify(json, null, 2));
  }
}

async function setupMulti() {
  const detected = detectEditors();
  if (detected.length === 0) {
    console.log('No se detectaron IDEs MCP, configure manualmente.');
    return;
  }

  detected.forEach(ed => writeConfig(ed, MCP_URL));

  console.log('Configuración MCP Stitch aplicada a:', detected.map(d => d.name).join(', '));
}

module.exports = { setupMulti };
```

Este esquema se basa en cómo Codex y OpenCode esperan que se definan los servidores MCP según su documentación oficial.[^5][^13]

### 4. Implementar el servidor MCP básico

La implementación concreta del protocolo MCP puede hacerse usando SDKs oficiales o wrappers, pero a alto nivel se trata de exponer:

- Un endpoint HTTP o proceso STDIO que responda a peticiones `list_tools` y `call_tool`.
- Una herramienta principal que haga de proxy hacia la API de Stitch (por ejemplo, `generate_ui` o `get_design`).[^8][^4]

Un servidor mínimo vía HTTP podría tener esta forma conceptual (simplificada):

```js
const express = require('express');
const bodyParser = require('body-parser');

function startMCPServer() {
  const app = express();
  app.use(bodyParser.json());

  app.post('/mcp/list_tools', (req, res) => {
    res.json({
      tools: [
        {
          name: 'stitch_generate_ui',
          description: 'Genera UI y código a partir de un prompt usando Google Stitch',
          input_schema: {
            type: 'object',
            properties: {
              prompt: { type: 'string' },
              projectId: { type: 'string' }
            },
            required: ['prompt']
          }
        }
      ]
    });
  });

  app.post('/mcp/call_tool', async (req, res) => {
    const { name, arguments: args } = req.body;

    if (name === 'stitch_generate_ui') {
      const result = await callStitchAPI(args);
      res.json({
        content: [
          { type: 'text', text: result.html },
          { type: 'text', text: result.css }
        ]
      });
    } else {
      res.status(400).json({ error: 'Tool not found' });
    }
  });

  const port = process.env.STITCH_MCP_PORT || 3001;
  app.listen(port, () => {
    console.log(`Stitch MCP server escuchando en http://localhost:${port}`);
  });
}

module.exports = { startMCPServer };
```

La función `callStitchAPI` encapsularía las llamadas HTTP o SDK a Stitch, usando credenciales obtenidas vía Google Cloud (Application Default Credentials, OAuth, etc.), tal como muestran ejemplos de proxy en Antigravity que ejecutan `npx @_davideast/stitch-mcp`.[^14]

### 5. Implementar `sync` para scaffolding de proyectos

El comando `sync` puede tener distintas profundidades, desde algo muy simple (guardar el HTML/CSS generado) hasta algo sofisticado (mapear a componentes React/Next.js con rutas, layouts y hooks).

Una versión mínima podría:

1. Llamar a la herramienta MCP `stitch_generate_ui` con un prompt o identificador de diseño.
2. Guardar el resultado en el directorio indicado por `--output`, por ejemplo `src/components/StitchDesign.jsx` y `src/styles/stitch.css`.

Pseudocódigo:

```js
const fs = require('fs');
const path = require('path');

async function syncDesign(designName, { output }) {
  console.log(`Sincronizando diseño "${designName}" desde Stitch...`);

  const result = await callStitchAPI({ prompt: designName });

  const outDir = output || 'src';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, 'StitchDesign.html'), result.html);
  if (result.css) fs.writeFileSync(path.join(outDir, 'stitch.css'), result.css);

  console.log('Diseño guardado en', outDir);
}

module.exports = { syncDesign };
```

A partir de aquí se pueden añadir plantillas específicas (React/Next.js, Vue, Svelte, Flutter) como capas opcionales sin que el servidor MCP tenga que cambiar; el servidor sigue devolviendo datos neutrales (HTML/CSS/tokens) y el CLI hace el mapeo a frameworks.

## Ventajas del enfoque híbrido MCP + CLI

### 1. Un solo paquete cubre IDEs y pipelines

- Los IDEs/CLIs con soporte MCP (Cursor, Claude Code, OpenCode, Antigravity, VS Code Copilot, Codex CLI, etc.) pueden conectarse al mismo servidor `stitch-mcp-cli` mediante sus archivos de configuración nativos.[^3][^13][^5]
- El CLI permite integrar Stitch en pipelines de CI/CD y scripts (por ejemplo, `stitch-mcp-cli sync` en un workflow de GitHub Actions o en un script de build local), algo que MCP puro no cubre de forma directa.[^7][^6]

### 2. Menos fricción para el usuario final

Los usuarios suelen encontrar tedioso configurar MCP manualmente en cada editor (paths, comandos, variables de entorno). Un comando `setup` que auto-detecta IDEs y escribe config reduce drásticamente esa fricción y aumenta la probabilidad de adopción.[^4][^15]

En Antigravity, por ejemplo, la configuración manual requiere escribir a mano `mcp_config.json` y crear un script shell que exporte variables de entorno y ejecute `npx @_davideast/stitch-mcp` con los parámetros correctos. Un CLI que genere automáticamente esa entrada y script simplifica mucho el onboarding.[^14]

### 3. Extensibilidad por capas

- El servidor MCP puede mantenerse delgado, centrado en exponer herramientas básicas de Stitch (generar UI, leer diseños, etc.).[^8][^4]
- El CLI encima puede añadir 
  - plantillas de scaffolding por framework,
  - integración con sistemas de despliegue,
  - comandos de diagnóstico o benchmarking.

Esto permite evolucionar ciertas funcionalidades sin forzar a todos los clientes MCP a actualizar sus integraciones específicas.

### 4. Multi-editor y multi-framework sin "lock-in"

Dado que el servidor MCP habla en términos neutrales (herramientas con schemas JSON), cualquier cliente MCP puede usarlo, y cualquier framework puede ser soportado a nivel de CLI usando transformaciones adicionales.[^6][^12]

El usuario puede empezar usando Stitch con Claude Code o Cursor, y más tarde mover su flujo a OpenCode, Antigravity o VS Code sin cambiar de servidor ni CLI; solo ajusta o vuelve a ejecutar `setup`.

### 5. Alineado con la evolución del ecosistema

Tanto la documentación de MCP como las guías de Codex y OpenCode enfatizan que MCP está diseñado para ser agnóstico del cliente, y que la forma recomendada de conectar herramientas externas es a través de servidores estándar, no integraciones ad-hoc por editor.[^12][^6][^13][^5]

Un proyecto híbrido Stitch MCP + CLI se sitúa justo en esa dirección: un servidor estándar + un CLI fino que automatiza la configuración y añade valor de developer experience.

## README sugerido para `stitch-mcp-cli`

```markdown
# stitch-mcp-cli 🧵

**Universal Stitch MCP + CLI**

Híbrido MCP + CLI para conectar Google Stitch con tus agentes de código y tus pipelines:

- `stitch-mcp-cli setup` → auto-configura MCP en **Cursor, Claude Code, OpenCode, Antigravity, VS Code, Codex CLI** (y más) en un solo paso.
- `stitch-mcp-cli mcp` → lanza el servidor Stitch MCP local para cualquier cliente compatible.
- `stitch-mcp-cli sync` → sincroniza diseños de Stitch a tu proyecto (HTML/CSS/tokens, listo para mapear a React/Next.js/Vue/etc.).

## ✨ ¿Por qué un enfoque híbrido (MCP + CLI)?

- **Un solo paquete para todo**: el mismo proyecto te da un **servidor MCP estándar** para editores y un **CLI** para scripts, CI/CD y terminal. No tienes que instalar cosas distintas para IDE y pipeline.
- **Multi-editor real**: el comando `setup` detecta editores/CLIs MCP (Cursor, Claude Code, OpenCode, Antigravity, VS Code, Codex, etc.) y escribe sus configs nativas para apuntar a `stitch-mcp-cli`.
- **Multi-framework por diseño**: el servidor MCP devuelve datos neutrales (HTML/CSS/tokens) desde Stitch, y el CLI se encarga del scaffolding. Puedes mapear esos resultados a React/Next.js, Vue, Svelte, Flutter o lo que uses en tu stack.
- **Menos fricción, más adopción**: configurar MCP a mano en cada IDE es tedioso. Con `stitch-mcp-cli setup` lo haces una vez y ya puedes escribir "usa stitch" en tu agente, sin tocar archivos de config.

## 🚀 Quickstart

```bash
npm install -g stitch-mcp-cli

# 1) Configurar MCP en todos los IDEs/CLIs detectados
stitch-mcp-cli setup

# 2) Lanzar el servidor Stitch MCP local
stitch-mcp-cli mcp

# 3) Sincronizar un diseño de Stitch al proyecto actual
stitch-mcp-cli sync "Landing Page" --output src/stitch
```

Luego, en tu editor (Cursor, Claude Code, OpenCode, Antigravity, etc.), puedes pedirle al agente:

> Usa el MCP `stitch` para generar o actualizar el diseño de la landing.

## ⚙️ Comandos

### `setup`

Detecta IDEs/CLIs compatibles y escribe las configuraciones MCP necesarias para apuntar a `stitch-mcp-cli`.

Ejemplos:

```bash
stitch-mcp-cli setup
# Salida esperada:
# ✅ cursor: ~/.cursor/mcp.json
# ✅ claude: ~/.claude/claude_desktop_config.json
# ✅ opencode: ~/.config/opencode/opencode.json
# ...
```

### `mcp`

Lanza el servidor Stitch MCP como proceso local (HTTP o STDIO según tu configuración).

```bash
stitch-mcp-cli mcp
# Escuchando en http://localhost:3001
```

### `sync <designName>`

Sincroniza un diseño de Stitch con el proyecto actual. Por defecto guarda HTML/CSS/tokens en `src/`, pero se puede personalizar.

```bash
stitch-mcp-cli sync "Dashboard de Analytics" --output src/stitch
```

## 🧱 Roadmap

- [ ] Soporte avanzado de scaffolding por framework (React/Next.js, Vue/Nuxt, SvelteKit, Flutter).
- [ ] Integraciones de despliegue (Vercel, Cloudflare, etc.).
- [ ] Modo "watch" para actualizar el código cuando cambie el diseño en Stitch.

## 📝 Licencia

MIT
```

Este README explica claramente el valor del enfoque híbrido, los comandos principales y cómo se relaciona con la configuración multi-editor y multi-framework.

---

## References

1. [davideast/stitch-mcp](https://github.com/davideast/stitch-mcp) - # Set up authentication and MCP client config npx @_davideast/stitch-mcp ... Supported clients: VS C...

2. [Stitch MCP Helper CLI | MCP Servers](https://lobehub.com/mcp/davideast-stitch-mcp)

3. [Stitch MCP Practical Guide — From Installation to UI Generation](https://blog.sotaaz.com/post/stitch-mcp-guide-en) - Stitch MCP connects it to AI coding agents (Claude Code, Cursor, Gemini CLI, etc.) as an MCP server....

4. [The Stitch MCP Update That Gave AI Agents “Eyes”](https://www.reddit.com/r/AISEOInsider/comments/1qlrh3l/the_stitch_mcp_update_that_gave_ai_agents_eyes/) - Yes. It supports Cursor, VS Code, Gemini CLI, Claude Code, and any other MCP-compatible client. Wher...

5. [MCP servers - OpenCode](https://opencode.ai/docs/mcp-servers/) - Add local and remote MCP tools.

6. [MCP vs CLI Tools: Which is best for production applications?](https://www.runlayer.com/blog/mcp-vs-cli-for-ai-agents-choosing-the-right-interface) - A single-tool MCP can avoid these issues by exposing one tool whose input is a well-known programmin...

7. [MCP vs. CLI: When to Use Them and Why](https://www.descope.com/blog/post/mcp-vs-cli) - Besides the schema overhead being a non-issue, MCP solves problems CLI doesn't attempt to address. T...

8. [Design-to-Code con Antigravity y Stitch MCP](https://codelabs.developers.google.com/design-to-code-with-antigravity-stitch?hl=es_419) - Crea una aplicación web profesional que combine el diseño de IA y la programación autónoma. Usarás G...

9. [Stitch - Design with AI - Google](https://stitch.withgoogle.com) - Stitch generates UIs for mobile and web applications, making design ideation fast and easy.

10. [Introducing “vibe design” with Stitch - Google Blog](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/) - Stitch is evolving into an AI-native platform that allows anyone to create, iterate, and collaborate...

11. [What Is Google Stitch? The AI Design Tool That Has Figma Worried](https://agentdock.ai/academy/what-is-google-stitch-the-ai-design-tool-that-has-figma-worried) - Google Stitch turns text and voice into full UI designs with code export. Free, Gemini-powered, and ...

12. [MCP vs CLI: Benchmarking Tools for Coding Agents](https://mariozechner.at/posts/2025-08-15-mcp-vs-cli/) - A data-driven comparison of MCP and CLI approaches for coding agent terminal control.

13. [codex/docs/config.md at main · openai/codex · GitHub](https://github.com/openai/codex/blob/main/docs/config.md) - Lightweight coding agent that runs in your terminal - openai/codex

14. [Stitch MCP installation in Antigravity](https://discuss.ai.google.dev/t/stitch-mcp-installation-in-antigravity/118194) - Has anyone managed to install this MCP? Can’t find it in MCP store so manual install necessary but I...

15. [MCP vs CLI | ¿Cómo deben conectarse los agentes de IA a ...](https://devgent.org/es/2026/03/17/mcp-vs-cli-ai-agent-comparison-es/) - MCP vs CLI para la integración de herramientas en agentes de IA — comparación exhaustiva. Los benchm...

