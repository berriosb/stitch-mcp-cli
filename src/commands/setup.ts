import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { getConfigPath } from "../lib/config.js";

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

function getMcpConfig(editor: Editor, apiKeyEnv: string): string {
  if (editor.format === "toml") {
    return `\n[[mcp_servers.stitch]]
command = "npx"
args = ["stitch-mcp-cli"]
[input]
STITCH_API_KEY = "\${STITCH_API_KEY}"
`;
  }

  return JSON.stringify({
    mcpServers: {
      stitch: {
        command: "npx",
        args: ["stitch-mcp-cli"],
        env: {
          STITCH_API_KEY: "\${STITCH_API_KEY}",
        },
      },
    },
  }, null, 2);
}

/**
 * Auto-configure MCP server in supported IDEs (Cursor, Claude Code, VS Code, etc.)
 * @param options.editor - Filter to specific editor name
 * @param options.verbose - Show detailed output
 */
export async function setup(options: { editor?: string; verbose?: boolean }) {
  const configPath = getConfigPath();
  let apiKeyEnv = "\${STITCH_API_KEY}";

  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (config.apiKey) {
        console.log("i Usando API key de ~/.stitch-mcp-cli/config.json");
        apiKeyEnv = "\${STITCH_API_KEY}";
      }
    } catch {
      // Ignore
    }
  }

  const detected = detectEditors();

  if (detected.length === 0) {
    console.log("No se detectaron IDEs compatibles instalados.");
    console.log("Puedes configurar manualmente agregando stitch-mcp-cli a tu config MCP.");
    console.log("\nEjemplo de configuración:");
    console.log(JSON.stringify({
      mcpServers: {
        stitch: {
          command: "npx",
          args: ["stitch-mcp-cli"],
          env: { STITCH_API_KEY: process.env.STITCH_API_KEY || "\${STITCH_API_KEY}" },
        },
      },
    }, null, 2));
    return;
  }

  const targetEditors = options.editor
    ? detected.filter((e) => e.name.toLowerCase() === options.editor!.toLowerCase())
    : detected;

  if (targetEditors.length === 0) {
    console.log(`Editor "${options.editor}" no detectado. IDEs detectados:`);
    detected.forEach((e) => console.log(`  - ${e.name}`));
    return;
  }

  let configured = 0;

  for (const editor of targetEditors) {
    const editorConfigPath = path.join(os.homedir(), editor.configPath);
    const configDir = path.dirname(editorConfigPath);

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const newConfig = getMcpConfig(editor, apiKeyEnv);

    if (editor.format === "json") {
      let existingConfig: Record<string, unknown> = {};
      if (fs.existsSync(editorConfigPath)) {
        try {
          existingConfig = JSON.parse(fs.readFileSync(editorConfigPath, "utf-8"));
        } catch {
          existingConfig = {};
        }
      }

      const mcpServers = (existingConfig.mcpServers as Record<string, unknown>) || {};
      mcpServers.stitch = {
        command: "npx",
        args: ["stitch-mcp-cli"],
        env: {
          STITCH_API_KEY: "${STITCH_API_KEY}",
        },
      };
      existingConfig.mcpServers = mcpServers;

      fs.writeFileSync(editorConfigPath, JSON.stringify(existingConfig, null, 2));
    } else {
      const dollar = "$";
      const tomlContent = [
        "",
        "[[mcp_servers.stitch]]",
        'command = "npx"',
        'args = ["stitch-mcp-cli"]',
        "env = { STITCH_API_KEY = " + dollar + "STITCH_API_KEY }",
        "",
      ].join("\n");
      if (fs.existsSync(editorConfigPath)) {
        const existing = fs.readFileSync(editorConfigPath, "utf-8");
        fs.writeFileSync(editorConfigPath, existing + tomlContent);
      } else {
        fs.writeFileSync(editorConfigPath, tomlContent);
      }
    }

    configured++;
    if (options.verbose) {
      console.log(`OK ${editor.name}: ${editorConfigPath}`);
    } else {
      console.log(`OK ${editor.name}`);
    }
  }

  console.log(`\nConfigurado en ${configured} IDE(s)`);
  console.log("\nPróximos pasos:");
  console.log("1. Si no tienes API key: stitch-mcp-cli auth --api-key <tu-key>");
  console.log("2. Exporta la variable: export STITCH_API_KEY=<tu-key>");
  console.log("3. Reinicia tu IDE");
  console.log("4. El servidor MCP se iniciará automáticamente");
}
