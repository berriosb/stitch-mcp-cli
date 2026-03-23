#!/usr/bin/env node
import "dotenv/config";
import { StitchProxy } from "@google/stitch-sdk";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./lib/config.js";

const config = loadConfig();
const apiKey = config.apiKey || process.env.STITCH_API_KEY;

if (!apiKey) {
  console.error("Error: STITCH_API_KEY no está configurada.");
  console.error("Ejecuta: stitch-mcp-cli auth --api-key <tu-api-key>");
  process.exit(1);
}

const proxy = new StitchProxy({ apiKey });
const transport = new StdioServerTransport();

console.error("Stitch MCP Proxy iniciado (API key: " + (apiKey.slice(0, 8) + "...") + ")");

await proxy.start(transport);
