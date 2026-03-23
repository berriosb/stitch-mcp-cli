import { stitch as stitchSingleton, StitchToolClient } from "@google/stitch-sdk";
import { loadConfig } from "./config.js";

export interface StitchClient {
  stitch: typeof stitchSingleton;
  client: StitchToolClient;
}

let cachedClient: StitchClient | null = null;

export function getStitchClient(): StitchClient {
  if (cachedClient) {
    return cachedClient;
  }

  const config = loadConfig();
  const apiKey = config.apiKey || process.env.STITCH_API_KEY;

  if (!apiKey) {
    throw new Error(
      "API key no configurada. Ejecuta: stitch-mcp-cli auth --api-key <tu-api-key>"
    );
  }

  const client = new StitchToolClient({ apiKey });

  cachedClient = {
    stitch: stitchSingleton,
    client,
  };

  return cachedClient;
}

export async function closeStitchClient(): Promise<void> {
  if (cachedClient) {
    await cachedClient.client.close();
    cachedClient = null;
  }
}
