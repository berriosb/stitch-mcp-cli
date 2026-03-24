import { stitch as stitchSingleton, StitchToolClient } from "@google/stitch-sdk";
import { loadSecureConfig } from "./secure-config.js";

export interface StitchClient {
  stitch: typeof stitchSingleton;
  client: StitchToolClient;
}

let cachedClient: StitchClient | null = null;

/**
 * Get or create a cached Stitch client instance
 * @returns StitchClient with stitch SDK and client
 * @throws Error if API key is not configured
 */
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

  const client = new StitchToolClient({ apiKey });

  cachedClient = {
    stitch: stitchSingleton,
    client,
  };

  return cachedClient;
}

/**
 * Close the cached Stitch client connection
 */
export async function closeStitchClient(): Promise<void> {
  if (cachedClient) {
    await cachedClient.client.close();
    cachedClient = null;
  }
}
