#!/usr/bin/env node
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadSecureConfig } from "./lib/secure-config.js";
import { getStitchClient, closeStitchClient } from "./lib/stitch-client.js";
import { getCache } from "./lib/cache.js";
import { transformToFramework } from "./lib/template-engine.js";
import { isOnline } from "./lib/network.js";
import { logger } from "./lib/logger.js";
import { checkRateLimit } from "./lib/rate-limiter.js";
import type { CachedProject, CachedScreen } from "./types/index.js";

const config = loadSecureConfig();
const apiKey = config.apiKey || process.env.STITCH_API_KEY;

if (!apiKey) {
  logger.error("STITCH_API_KEY no está configurada. Ejecuta: stitch-mcp-cli auth --api-key <tu-api-key>");
  process.exit(1);
}

const server = new McpServer({
  name: "stitch-mcp",
  version: "1.0.0"
});

const ListProjectsSchema = z.object({
  search: z.string().optional().describe("Filter projects by search term"),
  json: z.boolean().default(false).describe("Return output as JSON")
});

const GenerateScreenSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").describe("Design prompt for the screen"),
  projectId: z.string().optional().describe("Stitch project ID"),
  device: z.enum(["mobile", "desktop", "tablet"]).optional().default("mobile").describe("Device type"),
  name: z.string().optional().describe("Name for the generated screen")
});

const SyncScreenSchema = z.object({
  projectId: z.string().describe("Stitch project ID"),
  screenId: z.string().optional().describe("Specific screen ID (syncs all if not provided"),
  output: z.string().optional().default("./stitch-output").describe("Output directory")
});

const ExportFrameworkSchema = z.object({
  projectId: z.string().describe("Stitch project ID"),
  framework: z.enum(["react", "vue", "svelte", "nextjs", "vanilla"]).default("react").describe("Target framework"),
  output: z.string().optional().default("./stitch-export").describe("Output directory"),
  routes: z.string().optional().describe("Comma-separated routes for Next.js")
});

const CacheStatusSchema = z.object({});

const CacheClearSchema = z.object({});

const CacheSyncSchema = z.object({
  projectId: z.string().describe("Project ID to sync to cache")
});

server.registerTool(
  "stitch_list_projects",
  {
    title: "List Stitch Projects",
    description: "List all Google Stitch projects accessible with the configured API key. Supports filtering by search term and offline mode.",
    inputSchema: ListProjectsSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async ({ search, json }) => {
    const toolLogger = logger.child({ tool: "stitch_list_projects" });
    
    const rateLimit = checkRateLimit("stitch_list_projects");
    if (!rateLimit.allowed) {
      toolLogger.warn({ retryAfterMs: rateLimit.retryAfterMs }, "Rate limit exceeded");
      return { content: [{ type: "text", text: `Rate limit exceeded. Retry after ${Math.ceil((rateLimit.retryAfterMs || 0) / 1000)}s` }] };
    }

    try {
      toolLogger.info({ search, json }, "Listing projects");
      const online = await isOnline();
      const cm = await getCache();

      if (!online) {
        const cached = await cm.listProjects();
        if (json) {
          toolLogger.info({ count: cached.length }, "Returning cached projects as JSON");
          return { content: [{ type: "text", text: JSON.stringify(cached, null, 2) }], structuredContent: { projects: cached } };
        }
        const output = cached.length === 0
          ? "No hay proyectos en caché. Conecta a internet para ver proyectos."
          : `Modo offline - ${cached.length} proyectos en caché:\n${cached.map(p => `- ${p.name} (${p.screens.length} pantallas)`).join("\n")}`;
        return { content: [{ type: "text", text: output }] };
      }

      const { stitch } = getStitchClient();
      const projects = await stitch.projects();

      let filtered = projects;
      if (search) {
        const term = search.toLowerCase();
        filtered = projects.filter(p => p.id.toLowerCase().includes(term));
      }

      const safeProjects = filtered.map(p => ({
        id: p.id,
        title: (p as any).title || p.id,
        screenCount: (p as any).screenCount ?? 0,
      }));

      if (json) {
        toolLogger.info({ count: safeProjects.length }, "Returning projects as JSON");
        return { content: [{ type: "text", text: JSON.stringify(safeProjects, null, 2) }], structuredContent: { projects: safeProjects } };
      }

      const output = safeProjects.length === 0
        ? "No hay proyectos. Crea uno en https://stitch.withgoogle.com"
        : `Proyectos (${safeProjects.length}):\n${safeProjects.map(p => `- ${p.id} (${p.title})`).join("\n")}`;
      toolLogger.info({ count: filtered.length }, "Projects listed successfully");
      return { content: [{ type: "text", text: output }] };
    } catch (error) {
      toolLogger.error({ error: error instanceof Error ? error.message : String(error) }, "Failed to list projects");
      return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);

server.registerTool(
  "stitch_generate_screen",
  {
    title: "Generate Screen",
    description: "Generate a new UI screen in Google Stitch from a text prompt. Uses the specified project or falls back to the first available project.",
    inputSchema: GenerateScreenSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  async ({ prompt, projectId, device, name }) => {
    try {
      const { stitch } = getStitchClient();
      let targetProjectId = projectId;
      let targetProject;

      if (targetProjectId) {
        targetProject = stitch.project(targetProjectId);
      } else {
        const projects = await stitch.projects();
        if (projects.length === 0) {
          return { content: [{ type: "text", text: "Error: No hay proyectos. Crea uno en https://stitch.withgoogle.com" }] };
        }
        targetProject = projects[0];
        targetProjectId = targetProject.id;
      }

      const deviceType = device?.toUpperCase() as "MOBILE" | "DESKTOP" | "TABLET" | "AGNOSTIC" | "DEVICE_TYPE_UNSPECIFIED" | undefined;
      const screen = await targetProject.generate(prompt, deviceType);

      const screenName = name || `screen_${Date.now()}`;
      const screenMetadata: CachedScreen = {
        id: screen.screenId,
        screenId: screen.screenId,
        html: "",
        lastSync: new Date().toISOString(),
      };

      return {
        content: [{
          type: "text",
          text: `Pantalla generada:\n- Project ID: ${screen.projectId}\n- Screen ID: ${screen.screenId}\n- Nombre: ${screenName}\n\nUsa stitch_sync_screen para obtener el HTML.`
        }],
        structuredContent: { projectId: screen.projectId, screenId: screen.screenId, screenName }
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error al generar: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);

server.registerTool(
  "stitch_sync_screen",
  {
    title: "Sync Screen to HTML",
    description: "Synchronize a screen from Google Stitch to local HTML files. If no screenId is provided, syncs all screens from the project.",
    inputSchema: SyncScreenSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async ({ projectId, screenId, output }) => {
    try {
      const { stitch } = getStitchClient();
      const project = stitch.project(projectId);

      if (screenId) {
        const screen = await project.getScreen(screenId);
        const html = await screen.getHtml();
        const filePath = `${output}/screen-${screenId}.html`;
        return {
          content: [{ type: "text", text: `Screen sincronizado: ${filePath}\n\n${html.slice(0, 500)}...` }],
          structuredContent: { filePath, html }
        };
      } else {
        const screens = await project.screens();
        return {
          content: [{ type: "text", text: `Sincronizados ${screens.length} pantallas a ${output}` }],
          structuredContent: { screenCount: screens.length, output }
        };
      }
    } catch (error) {
      return { content: [{ type: "text", text: `Error al sincronizar: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);

server.registerTool(
  "stitch_export_framework",
  {
    title: "Export to Framework",
    description: "Export a Stitch project to a specific UI framework (React, Vue, Svelte, Next.js, or Vanilla HTML). Transforms HTML into framework-specific components.",
    inputSchema: ExportFrameworkSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  async ({ projectId, framework, output, routes }) => {
    try {
      const { stitch } = getStitchClient();
      const project = stitch.project(projectId);
      const screens = await project.screens();

      if (framework === "nextjs" && routes) {
        const routeList = routes.split(",").map(r => r.trim());
        const results: Record<string, string> = {};

        for (const route of routeList) {
          const screen = screens.length > 0 ? screens[0] : null;
          const html = screen ? await screen.getHtml() : "<div></div>";
          const componentName = `Page${route.replace(/[\/\-]/g, "_") || "Home"}`;
          const code = await transformToFramework({ framework, componentName, html });
          results[route] = code;
        }

        return {
          content: [{ type: "text", text: `Exportado ${routeList.length} rutas a ${framework} en ${output}` }],
          structuredContent: { framework, output, routes: results }
        };
      }

      const results: Record<string, string> = {};
      for (const screen of screens) {
        const html = await screen.getHtml();
        const componentName = `Screen${screen.screenId.slice(0, 8)}`;
        const code = await transformToFramework({ framework, componentName, html });
        results[screen.screenId] = code;
      }

      return {
        content: [{ type: "text", text: `Exportado ${screens.length} pantallas a ${framework} en ${output}` }],
        structuredContent: { framework, output, screenCount: screens.length, components: results }
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error al exportar: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);

server.registerTool(
  "stitch_cache_status",
  {
    title: "Cache Status",
    description: "Get the current status of the local SQLite cache including project count, screen count, and cache size.",
    inputSchema: CacheStatusSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async () => {
    try {
      const cm = await getCache();
      const size = cm.getCacheSize();
      const projects = await cm.listProjects();

      const output = {
        projectCount: size.projectCount,
        screenCount: size.screenCount,
        sizeKB: parseFloat((size.sizeBytes / 1024).toFixed(2)),
        cacheDir: cm.getCacheDir(),
        projects: projects.map((p: CachedProject) => ({ name: p.name, screenCount: p.screens.length }))
      };

      return {
        content: [{ type: "text", text: `Caché:\n- Proyectos: ${size.projectCount}\n- Pantallas: ${size.screenCount}\n- Tamaño: ${output.sizeKB} KB` }],
        structuredContent: output
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);

server.registerTool(
  "stitch_cache_clear",
  {
    title: "Clear Cache",
    description: "Clear all cached projects and screens from the local SQLite database.",
    inputSchema: CacheClearSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }
  },
  async () => {
    try {
      const cm = await getCache();
      await cm.clearCache();
      return { content: [{ type: "text", text: "Caché eliminada correctamente" }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);

server.registerTool(
  "stitch_cache_sync",
  {
    title: "Sync Project to Cache",
    description: "Download and cache all screens from a Stitch project for offline access.",
    inputSchema: CacheSyncSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async ({ projectId }) => {
    try {
      const { stitch } = getStitchClient();
      const project = stitch.project(projectId);
      const screens = await project.screens();

      const cachedProject: CachedProject = {
        id: projectId,
        projectId: projectId,
        name: projectId,
        screens: [] as CachedScreen[],
        lastSync: new Date().toISOString(),
      };

      for (const screen of screens) {
        const html = await screen.getHtml();
        cachedProject.screens.push({
          id: screen.screenId,
          screenId: screen.screenId,
          html,
          lastSync: new Date().toISOString(),
        });
      }

      const cm = await getCache();
      await cm.saveProject(cachedProject);

      return {
        content: [{ type: "text", text: `${screens.length} pantallas cacheadas para proyecto ${projectId}` }],
        structuredContent: { projectId, screenCount: screens.length }
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);

let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info({ signal }, "Shutdown signal received");
  await closeStitchClient();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

async function main() {
  logger.info("Starting Stitch MCP Server");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info({ apiKeyPrefix: apiKey!.slice(0, 8) }, "Stitch MCP Server started");
}

main().catch((error) => {
  logger.fatal({ error }, "Failed to start MCP server");
  process.exit(1);
});
