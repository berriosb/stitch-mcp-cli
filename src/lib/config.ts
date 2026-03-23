import fs from "fs";
import path from "path";
import os from "os";

export interface Config {
  apiKey?: string;
  templateDir?: string;
  watchInterval?: number;
}

const CONFIG_DIR = path.join(os.homedir(), ".stitch-mcp-cli");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch {
    // Ignore errors, return empty config
  }
  return {};
}

export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}
