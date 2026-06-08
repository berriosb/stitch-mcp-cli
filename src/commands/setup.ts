import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";
import { execSync } from "child_process";
import { getConfigPath } from "../lib/config.js";

interface Editor {
  name: string;
  cmd: string;
  configPath: string;
  format: "json" | "toml" | "opencode";
}

const EDITORS: Editor[] = [
  { name: "Cursor", cmd: "cursor", configPath: ".cursor/mcp.json", format: "json" },
  { name: "Claude Code", cmd: "claude", configPath: ".claude/claude_desktop_config.json", format: "json" },
  { name: "VS Code", cmd: "code", configPath: ".config/Code/User/global.json", format: "json" },
  { name: "OpenCode", cmd: "opencode", configPath: ".config/opencode/opencode.json", format: "opencode" },
  { name: "Kilo Code", cmd: "kilo", configPath: ".config/kilo/opencode.json", format: "opencode" },
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
  if (editor.format === "toml") {
    return `\n[[mcp_servers.stitch]]
command = "npx"
args = ["stitch-mcp-cli"]
`;
  }

  if (editor.format === "opencode") {
    return JSON.stringify({
      $schema: "https://opencode.ai/config.json",
      mcp: {
        stitch: {
          type: "local",
          command: ["npx", "stitch-mcp-cli"],
          enabled: true,
        },
      },
    }, null, 2);
  }

  return JSON.stringify({
    mcpServers: {
      stitch: {
        command: "npx",
        args: ["stitch-mcp-cli"],
      },
    },
  }, null, 2);
}

const SKILL_NAME = "stitch-design-taste";
const AGENTS_SKILLS_DIR = path.join(os.homedir(), ".agents", "skills");
const SKILL_TARGET_DIR = path.join(AGENTS_SKILLS_DIR, SKILL_NAME);

function getSkillSourcePath(): string | null {
  const candidates = [
    path.join(__dirname, "..", "..", "skills", SKILL_NAME, "SKILL.md"),
    path.join(process.cwd(), "skills", SKILL_NAME, "SKILL.md"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function isSkillInstalled(): boolean {
  return fs.existsSync(path.join(SKILL_TARGET_DIR, "SKILL.md"));
}

function installSkill(): boolean {
  const sourcePath = getSkillSourcePath();
  if (!sourcePath) {
    console.log("  No se encontró el archivo SKILL.md para instalar.");
    return false;
  }

  if (!fs.existsSync(AGENTS_SKILLS_DIR)) {
    fs.mkdirSync(AGENTS_SKILLS_DIR, { recursive: true });
  }

  if (!fs.existsSync(SKILL_TARGET_DIR)) {
    fs.mkdirSync(SKILL_TARGET_DIR, { recursive: true });
  }

  const skillContent = fs.readFileSync(sourcePath, "utf-8");
  fs.writeFileSync(path.join(SKILL_TARGET_DIR, "SKILL.md"), skillContent);

  return true;
}

function promptMode(): Promise<"mcp" | "mcp+skill"> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("\n? Qué quieres instalar?");
    console.log("  1) Solo MCP server");
    console.log("  2) MCP server + Skill de diseño (stitch-design-taste)");
    rl.question("\n  Selecciona [1/2] (default: 1): ", (answer) => {
      rl.close();
      const choice = answer.trim();
      if (choice === "2") {
        resolve("mcp+skill");
      } else {
        resolve("mcp");
      }
    });
  });
}

export async function setup(options: { editor?: string; verbose?: boolean }) {
  if (fs.existsSync(getConfigPath())) {
    console.log("i Usando API key de ~/.stitch-mcp-cli/config.json (encriptada)");
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

  let mode: "mcp" | "mcp+skill" = "mcp";
  if (process.stdin.isTTY && !isSkillInstalled()) {
    mode = await promptMode();
  } else if (isSkillInstalled()) {
    console.log("i Skill stitch-design-taste ya instalada en ~/.agents/skills/");
  }

  let configured = 0;

  for (const editor of targetEditors) {
    const editorConfigPath = path.join(os.homedir(), editor.configPath);
    const configDir = path.dirname(editorConfigPath);

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

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
      };
      existingConfig.mcpServers = mcpServers;

      fs.writeFileSync(editorConfigPath, JSON.stringify(existingConfig, null, 2));
    } else if (editor.format === "opencode") {
      let existingConfig: Record<string, unknown> = {};
      if (fs.existsSync(editorConfigPath)) {
        try {
          existingConfig = JSON.parse(fs.readFileSync(editorConfigPath, "utf-8"));
        } catch {
          existingConfig = {};
        }
      }

      delete existingConfig.mcpServers;

      const mcp = (existingConfig.mcp as Record<string, unknown>) || {};
      mcp.stitch = {
        type: "local",
        command: ["npx", "stitch-mcp-cli"],
        enabled: true,
      };
      existingConfig.mcp = mcp;

      if (!existingConfig.$schema) {
        existingConfig.$schema = "https://opencode.ai/config.json";
      }

      fs.writeFileSync(editorConfigPath, JSON.stringify(existingConfig, null, 2));
    } else {
      const tomlSection = [
        "",
        "[mcp_servers.stitch]",
        'command = "npx"',
        'args = ["stitch-mcp-cli"]',
        "",
      ].join("\n");
      
      if (fs.existsSync(editorConfigPath)) {
        const existing = fs.readFileSync(editorConfigPath, "utf-8");
        const cleaned = existing.replace(/\n?\[\[?mcp_servers\.stitch\]\]?[\s\S]*?(?=\n\[|$)/g, "");
        fs.writeFileSync(editorConfigPath, cleaned + tomlSection);
      } else {
        fs.writeFileSync(editorConfigPath, tomlSection);
      }
    }

    configured++;
    if (options.verbose) {
      console.log(`OK ${editor.name}: ${editorConfigPath}`);
    } else {
      console.log(`OK ${editor.name}`);
    }
  }

  if (mode === "mcp+skill") {
    console.log("\nInstalando skill stitch-design-taste...");
    if (installSkill()) {
      console.log(`OK Skill instalada en ${SKILL_TARGET_DIR}`);
    }
  }

  console.log(`\nConfigurado en ${configured} IDE(s)`);
  console.log("\nPróximos pasos:");
  console.log("1. Si no tienes API key: stitch-mcp-cli auth --api-key <tu-key>");
  console.log("2. Reinicia tu IDE");
  console.log("3. El servidor MCP se iniciará automáticamente");
  if (mode === "mcp+skill") {
    console.log("4. La skill estará disponible para tu agente automáticamente");
  }
}
