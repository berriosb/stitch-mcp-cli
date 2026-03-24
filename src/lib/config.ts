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

/**
 * Load configuration from ~/.stitch-mcp-cli/config.json
 * @returns Config object with apiKey and optional settings
 */
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

/**
 * Save configuration to ~/.stitch-mcp-cli/config.json
 * @param config - Configuration object to save
 */
export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Get the configuration file path
 * @returns Full path to config.json
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}

/**
 * Get the configuration directory path
 * @returns Full path to ~/.stitch-mcp-cli
 */
export function getConfigDir(): string {
  return CONFIG_DIR;
}
