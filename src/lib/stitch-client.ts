import { Stitch, StitchToolClient, StitchError } from "@google/stitch-sdk";
import { loadSecureConfig } from "./secure-config.js";

export { StitchError };

export interface StitchClient {
  stitch: Stitch;
  client: StitchToolClient;
  callTool: <T = any>(name: string, args: Record<string, unknown>) => Promise<T>;
  httpPost: <T = any>(path: string, body: unknown) => Promise<T>;
}

let cachedClient: StitchClient | null = null;

export function getStitchClient(): StitchClient {
  if (cachedClient) {
    return cachedClient;
  }

  const { apiKey: configApiKey } = loadSecureConfig();
  const apiKey = configApiKey || process.env.STITCH_API_KEY;
  const accessToken = process.env.STITCH_ACCESS_TOKEN;

  if (!apiKey && !accessToken) {
    throw new Error(
      "Credenciales no configuradas. Ejecuta: stitch-mcp-cli auth --api-key <tu-api-key> o configura STITCH_ACCESS_TOKEN"
    );
  }

  if (apiKey) {
    process.env.STITCH_API_KEY = apiKey;
  }

  const client = new StitchToolClient({ apiKey, accessToken });

  cachedClient = {
    stitch: new Stitch(client),
    client,
    callTool: (name, args) => client.callTool(name, args),
    httpPost: (path, body) => client.httpPost(path, body),
  };

  return cachedClient;
}

export async function closeStitchClient(): Promise<void> {
  if (cachedClient) {
    await cachedClient.client.close();
    cachedClient = null;
  }
}
