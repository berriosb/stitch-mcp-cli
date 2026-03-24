#!/usr/bin/env node
import "dotenv/config";
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { loadConfig } from "./lib/config.js";
import { getStitchClient, closeStitchClient } from "./lib/stitch-client.js";
import { logger } from "./lib/logger.js";

const config = loadConfig();
const PORT = parseInt(process.env.MCP_PORT || "3100", 10);
const HOST = process.env.MCP_HOST || "localhost";

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    transport.close();
    logger.debug({ sessionId: transport.sessionId }, "HTTP session closed");
  });

  try {
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    logger.error({ error }, "Error handling MCP request");
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

let server: ReturnType<typeof app.listen> | null = null;

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received");
  if (server) {
    server.close();
  }
  await closeStitchClient();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

async function main() {
  logger.info({ port: PORT, host: HOST }, "Starting Stitch MCP HTTP Server");
  
  const apiKey = config.apiKey || process.env.STITCH_API_KEY;
  if (!apiKey) {
    logger.error("STITCH_API_KEY no está configurada");
    process.exit(1);
  }

  server = app.listen(PORT, HOST, () => {
    logger.info({ port: PORT, host: HOST }, `Stitch MCP HTTP Server running on http://${HOST}:${PORT}/mcp`);
  });
}

main().catch((error) => {
  logger.fatal({ error }, "Failed to start HTTP server");
  process.exit(1);
});
