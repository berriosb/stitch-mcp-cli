import { StitchToolClient } from "@google/stitch-sdk";
import { saveSecureConfig, loadSecureConfig } from "../lib/secure-config.js";

/**
 * Configure or verify the Stitch API key (securely encrypted)
 * @param options.apiKey - API key to save
 * @param options.check - Verify existing API key
 */
export async function auth(options: { apiKey?: string; check?: boolean }) {
  if (options.check) {
    const { apiKey } = loadSecureConfig();
    if (!apiKey) {
      console.log("X API key no configurada");
      console.log("   Ejecuta: stitch-mcp-cli auth --api-key <tu-key>");
      process.exit(1);
    }

    try {
      const client = new StitchToolClient({ apiKey });
      await client.listTools();
      console.log("OK API key configurada y valida");
      await client.close();
    } catch {
      console.log("X API key invalida o expirada");
      process.exit(1);
    }
    return;
  }

  if (!options.apiKey) {
    console.error("Usage: stitch-mcp-cli auth --api-key <key>");
    process.exit(1);
  }

  saveSecureConfig(options.apiKey);
  console.log("OK API key encriptada y guardada en ~/.stitch-mcp-cli/config.json");
}
