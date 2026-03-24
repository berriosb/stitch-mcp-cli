import { Stitch, StitchToolClient } from "@google/stitch-sdk";
import { loadSecureConfig } from "./secure-config.js";

export interface StitchClient {
  stitch: Stitch;
  client: StitchToolClient;
  callTool: <T = any>(name: string, args: Record<string, unknown>) => Promise<T>;
}

let cachedClient: StitchClient | null = null;

export function getStitchClient(): StitchClient {
  if (cachedClient) {
    return cachedClient;
  }

  const { apiKey: configApiKey } = loadSecureConfig();
  const apiKey = configApiKey || process.env.STITCH_API_KEY;

  if (!apiKey) {
    throw new Error(
      "API key no configurada. Ejecuta: stitch-mcp-cli auth --api-key <tu-api-key>"
    );
  }

  process.env.STITCH_API_KEY = apiKey;

  const client = new StitchToolClient({ apiKey });

  cachedClient = {
    stitch: new Stitch(client),
    client,
    callTool: (name, args) => client.callTool(name, args),
  };

  return cachedClient;
}

export async function closeStitchClient(): Promise<void> {
  if (cachedClient) {
    await cachedClient.client.close();
    cachedClient = null;
  }
}
