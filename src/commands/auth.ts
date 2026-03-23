import { StitchToolClient } from "@google/stitch-sdk";
import { loadConfig, saveConfig } from "../lib/config.js";

export async function auth(options: { apiKey?: string; check?: boolean }) {
  if (options.check) {
    const config = loadConfig();
    if (!config.apiKey) {
      console.log("❌ API key no configurada");
      console.log("   Ejecuta: stitch-mcp-cli auth --api-key <tu-key>");
      process.exit(1);
    }

    try {
      const client = new StitchToolClient({ apiKey: config.apiKey });
      await client.listTools();
      console.log("✅ API key configurada y válida");
      await client.close();
    } catch {
      console.log("❌ API key inválida o expirada");
      process.exit(1);
    }
    return;
  }

  if (!options.apiKey) {
    console.error("Usage: stitch-mcp-cli auth --api-key <key>");
    process.exit(1);
  }

  saveConfig({ apiKey: options.apiKey });
  console.log("✅ API key guardada en ~/.stitch-mcp-cli/config.json");
}
