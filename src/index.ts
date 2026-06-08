#!/usr/bin/env node
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadSecureConfig } from "./lib/secure-config.js";
import { getStitchClient, closeStitchClient, StitchError } from "./lib/stitch-client.js";
import { getCache } from "./lib/cache.js";
import { transformToFramework } from "./lib/template-engine.js";
import { isOnline } from "./lib/network.js";
import { logger } from "./lib/logger.js";
import { checkRateLimit } from "./lib/rate-limiter.js";
import type { CachedProject, CachedScreen } from "./types/index.js";
import type { Screen } from "@google/stitch-sdk";
import fs from "fs";
import path from "path";

function formatStitchError(error: unknown): string {
  if (error instanceof StitchError) {
    let msg = `Error [${error.code}]: ${error.message}`;
    if (error.suggestion) msg += `\nSugerencia: ${error.suggestion}`;
    return msg;
  }
  return `Error: ${error instanceof Error ? error.message : String(error)}`;
}

async function resolveHtml(screen: Screen): Promise<string> {
  const raw = await screen.getHtml();
  if (!raw) return "<div></div>";
  if (raw.startsWith("http")) {
    try {
      const resp = await fetch(raw);
      if (!resp.ok) return "<div></div>";
      return await resp.text();
    } catch {
      return "<div></div>";
    }
  }
  return raw;
}

const config = loadSecureConfig();
const apiKey = config.apiKey || process.env.STITCH_API_KEY;
const accessToken = process.env.STITCH_ACCESS_TOKEN;

if (!apiKey && !accessToken) {
  logger.error("Credenciales no configuradas. Ejecuta: stitch-mcp-cli auth --api-key <tu-api-key> o configura STITCH_ACCESS_TOKEN");
  process.exit(1);
}

const server = new McpServer({
  name: "stitch-mcp",
  version: "2.0.0"
});

// ─── Schema definitions ───────────────────────────────────────────────

const ListProjectsSchema = z.object({
  search: z.string().optional().describe("Filter projects by search term"),
  json: z.boolean().default(false).describe("Return output as JSON")
});

const GenerateScreenSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").describe("Design prompt for the screen"),
  projectId: z.string().optional().describe("Stitch project ID"),
  device: z.enum(["mobile", "desktop", "tablet"]).optional().default("mobile").describe("Device type"),
  modelId: z.enum(["GEMINI_3_PRO", "GEMINI_3_FLASH", "GEMINI_3_1_PRO"]).optional().describe("Model to use for generation"),
  name: z.string().optional().describe("Name for the generated screen")
});

const SyncScreenSchema = z.object({
  projectId: z.string().describe("Stitch project ID"),
  screenId: z.string().optional().describe("Specific screen ID (syncs all if not provided"),
  output: z.string().optional().default("./stitch-output").describe("Output directory")
});

const ExportFrameworkSchema = z.object({
  projectId: z.string().describe("Stitch project ID"),
  framework: z.enum(["react", "vue", "svelte", "nextjs", "nuxt", "solid", "angular", "vanilla"]).default("react").describe("Target framework"),
  output: z.string().optional().default("./stitch-export").describe("Output directory"),
  routes: z.string().optional().describe("Comma-separated routes for Next.js")
});

const CreateProjectSchema = z.object({
  title: z.string().optional().describe("Project title")
});

const UploadImageSchema = z.object({
  projectId: z.string().describe("Stitch project ID"),
  filePath: z.string().describe("Absolute or relative path to the file (PNG, JPG, WEBP, HTML)"),
  title: z.string().optional().describe("Optional title for the uploaded screen"),
  createScreenInstances: z.boolean().optional().default(true).describe("Whether to create screen instances from the upload")
});

const CreateDesignSystemSchema = z.object({
  projectId: z.string().describe("Stitch project ID"),
  displayName: z.string().optional().describe("Display name for the design system"),
  designTokens: z.string().optional().describe("Design tokens as a string"),
  styleGuidelines: z.string().optional().describe("Style guidelines as a string"),
  theme: z.object({
    colorMode: z.enum(["LIGHT", "DARK", "COLOR_MODE_UNSPECIFIED"]).optional(),
    font: z.enum(["INTER", "BE_VIETNAM_PRO", "EPILOGUE", "LEXEND", "MANROPE", "NEWSREADER", "NOTO_SERIF", "PLUS_JAKARTA_SANS", "PUBLIC_SANS", "SPACE_GROTESK", "SPLINE_SANS", "WORK_SANS", "DM_SANS", "GEIST", "SORA", "DOMINE", "LIBRE_CASLON_TEXT", "EB_GARAMOND", "LITERATA", "SOURCE_SERIF_FOUR", "MONTSERRAT", "METROPOLIS", "SOURCE_SANS_THREE", "NUNITO_SANS", "ARIMO", "HANKEN_GROTESK", "RUBIK", "IBM_PLEX_SANS"]).optional(),
    headlineFont: z.enum(["INTER", "BE_VIETNAM_PRO", "EPILOGUE", "LEXEND", "MANROPE", "NEWSREADER", "NOTO_SERIF", "PLUS_JAKARTA_SANS", "PUBLIC_SANS", "SPACE_GROTESK", "SPLINE_SANS", "WORK_SANS", "DM_SANS", "GEIST", "SORA", "DOMINE", "LIBRE_CASLON_TEXT", "EB_GARAMOND", "LITERATA", "SOURCE_SERIF_FOUR", "MONTSERRAT", "METROPOLIS", "SOURCE_SANS_THREE", "NUNITO_SANS", "ARIMO", "HANKEN_GROTESK", "RUBIK", "IBM_PLEX_SANS"]).optional(),
    bodyFont: z.enum(["INTER", "BE_VIETNAM_PRO", "EPILOGUE", "LEXEND", "MANROPE", "NEWSREADER", "NOTO_SERIF", "PLUS_JAKARTA_SANS", "PUBLIC_SANS", "SPACE_GROTESK", "SPLINE_SANS", "WORK_SANS", "DM_SANS", "GEIST", "SORA", "DOMINE", "LIBRE_CASLON_TEXT", "EB_GARAMOND", "LITERATA", "SOURCE_SERIF_FOUR", "MONTSERRAT", "METROPOLIS", "SOURCE_SANS_THREE", "NUNITO_SANS", "ARIMO", "HANKEN_GROTESK", "RUBIK", "IBM_PLEX_SANS"]).optional(),
    roundness: z.enum(["ROUND_TWO", "ROUND_FOUR", "ROUND_EIGHT", "ROUND_TWELVE", "ROUND_FULL"]).optional(),
    customColor: z.string().optional(),
    saturation: z.number().optional(),
    colorVariant: z.enum(["MONOCHROME", "NEUTRAL", "TONAL_SPOT", "VIBRANT", "EXPRESSIVE", "FIDELITY", "CONTENT", "RAINBOW", "FRUIT_SALAD"]).optional(),
    overridePrimaryColor: z.string().optional(),
    backgroundLight: z.string().optional(),
    backgroundDark: z.string().optional(),
  }).optional().describe("Design theme configuration")
});

const ListDesignSystemsSchema = z.object({
  projectId: z.string().describe("Stitch project ID")
});

const UpdateDesignSystemSchema = z.object({
  projectId: z.string().describe("Stitch project ID"),
  designSystemId: z.string().describe("Design system asset ID"),
  displayName: z.string().optional().describe("Updated display name"),
  designTokens: z.string().optional().describe("Updated design tokens"),
  styleGuidelines: z.string().optional().describe("Updated style guidelines"),
  theme: z.object({
    colorMode: z.enum(["LIGHT", "DARK", "COLOR_MODE_UNSPECIFIED"]).optional(),
    font: z.enum(["INTER", "BE_VIETNAM_PRO", "EPILOGUE", "LEXEND", "MANROPE", "NEWSREADER", "NOTO_SERIF", "PLUS_JAKARTA_SANS", "PUBLIC_SANS", "SPACE_GROTESK", "SPLINE_SANS", "WORK_SANS", "DM_SANS", "GEIST", "SORA", "DOMINE", "LIBRE_CASLON_TEXT", "EB_GARAMOND", "LITERATA", "SOURCE_SERIF_FOUR", "MONTSERRAT", "METROPOLIS", "SOURCE_SANS_THREE", "NUNITO_SANS", "ARIMO", "HANKEN_GROTESK", "RUBIK", "IBM_PLEX_SANS"]).optional(),
    roundness: z.enum(["ROUND_TWO", "ROUND_FOUR", "ROUND_EIGHT", "ROUND_TWELVE", "ROUND_FULL"]).optional(),
    customColor: z.string().optional(),
    saturation: z.number().optional(),
  }).optional().describe("Updated design theme")
});

const ApplyDesignSystemSchema = z.object({
  projectId: z.string().describe("Stitch project ID"),
  designSystemId: z.string().describe("Design system asset ID to apply"),
  screenIds: z.array(z.object({
    id: z.string().describe("Screen instance ID"),
    sourceScreen: z.string().describe("Source screen resource name")
  })).min(1).describe("Screen instances to apply the design system to")
});

const CacheStatusSchema = z.object({});

const CacheClearSchema = z.object({});

const CacheSyncSchema = z.object({
  projectId: z.string().describe("Project ID to sync to cache")
});

// ─── Tool: stitch_list_projects ───────────────────────────────────────

server.registerTool(
  "stitch_list_projects",
  {
    title: "List Stitch Projects",
    description: "List all Google Stitch projects accessible with the configured credentials. Supports filtering by search term and offline mode.",
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

      const safeProjects = filtered.map((p: any) => ({
        id: p.id,
        title: p.data?.title || p.data?.displayName || p.id,
        screenCount: p.data?.screenCount ?? p.data?.screens?.length ?? 0,
      }));

      if (json) {
        toolLogger.info({ count: safeProjects.length }, "Returning projects as JSON");
        return { content: [{ type: "text", text: JSON.stringify(safeProjects, null, 2) }], structuredContent: { projects: safeProjects } };
      }

      const output = safeProjects.length === 0
        ? "No hay proyectos. Crea uno con stitch_create_project"
        : `Proyectos (${safeProjects.length}):\n${safeProjects.map(p => `- ${p.id} (${p.title})`).join("\n")}`;
      toolLogger.info({ count: filtered.length }, "Projects listed successfully");
      return { content: [{ type: "text", text: output }] };
    } catch (error) {
      toolLogger.error({ error: error instanceof Error ? error.message : String(error) }, "Failed to list projects");
      return { content: [{ type: "text", text: formatStitchError(error) }] };
    }
  }
);

// ─── Tool: stitch_create_project ──────────────────────────────────────

server.registerTool(
  "stitch_create_project",
  {
    title: "Create Stitch Project",
    description: "Create a new Google Stitch project. A project is a container for UI designs and frontend code.",
    inputSchema: CreateProjectSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  async ({ title }) => {
    try {
      const { stitch } = getStitchClient();
      const project = await stitch.createProject(title);

      return {
        content: [{
          type: "text",
          text: `Proyecto creado:\n- Project ID: ${project.projectId}\n- Title: ${title || project.data?.title || "Sin título"}\n\nUsa stitch_generate_screen para crear pantallas.`
        }],
        structuredContent: { projectId: project.projectId, title: title || project.data?.title }
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error al crear proyecto: ${formatStitchError(error)}` }] };
    }
  }
);

// ─── Tool: stitch_generate_screen ─────────────────────────────────────

server.registerTool(
  "stitch_generate_screen",
  {
    title: "Generate Screen",
    description: "Generate a new UI screen in Google Stitch from a text prompt. Uses the specified project or falls back to the first available project. Supports model selection (GEMINI_3_PRO, GEMINI_3_FLASH, GEMINI_3_1_PRO).",
    inputSchema: GenerateScreenSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  async ({ prompt, projectId, device, modelId, name }) => {
    try {
      const { stitch } = getStitchClient();
      let targetProjectId = projectId;
      let targetProject;

      if (targetProjectId) {
        targetProject = stitch.project(targetProjectId);
      } else {
        const projects = await stitch.projects();
        if (projects.length === 0) {
          return { content: [{ type: "text", text: "Error: No hay proyectos. Usa stitch_create_project para crear uno." }] };
        }
        targetProject = projects[0];
        targetProjectId = targetProject.id;
      }

      const deviceType = device?.toUpperCase() as "MOBILE" | "DESKTOP" | "TABLET" | "AGNOSTIC" | "DEVICE_TYPE_UNSPECIFIED" | undefined;
      const screen = await targetProject.generate(prompt, deviceType, modelId as any);

      const screenName = name || `screen_${Date.now()}`;
      const screenMetadata: CachedScreen = {
        id: screen.screenId,
        screenId: screen.screenId,
        html: "",
        lastSync: new Date().toISOString(),
      };

      const metaLines = [
        `- Project ID: ${screen.projectId}`,
        `- Screen ID: ${screen.screenId}`,
        `- Nombre: ${screenName}`,
      ];
      if (modelId) metaLines.push(`- Model: ${modelId}`);
      metaLines.push("", "Usa stitch_sync_screen para obtener el HTML.");

      return {
        content: [{
          type: "text",
          text: `Pantalla generada:\n${metaLines.join("\n")}`
        }],
        structuredContent: { projectId: screen.projectId, screenId: screen.screenId, screenName, modelId }
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error al generar: ${formatStitchError(error)}` }] };
    }
  }
);

// ─── Tool: stitch_upload_image ────────────────────────────────────────

server.registerTool(
  "stitch_upload_image",
  {
    title: "Upload Image/File to Project",
    description: "Upload a design file (PNG, JPG, WEBP, HTML) to a Stitch project. Creates new screen canvases from the file contents.",
    inputSchema: UploadImageSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  async ({ projectId, filePath, title, createScreenInstances }) => {
    try {
      const { stitch } = getStitchClient();
      const project = stitch.project(projectId);

      const resolvedPath = path.resolve(filePath);
      if (!fs.existsSync(resolvedPath)) {
        return { content: [{ type: "text", text: `Error: archivo no encontrado: ${resolvedPath}` }] };
      }

      const screens = await project.upload(resolvedPath, {
        title,
        createScreenInstances: createScreenInstances ?? true,
      });

      const screenList = screens.map(s => `  - ${s.screenId}`).join("\n");

      return {
        content: [{
          type: "text",
          text: `${screens.length} pantalla(s) creada(s) desde ${path.basename(resolvedPath)}:\n${screenList}`
        }],
        structuredContent: {
          projectId,
          screenCount: screens.length,
          screenIds: screens.map(s => s.screenId)
        }
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error al subir: ${formatStitchError(error)}` }] };
    }
  }
);

// ─── Tool: stitch_sync_screen ─────────────────────────────────────────

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

      const outDir = path.resolve(output);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      if (screenId) {
        const screen = await project.getScreen(screenId);
        const html = await resolveHtml(screen);
        const filePath = path.join(outDir, `screen-${screenId}.html`);
        fs.writeFileSync(filePath, html, "utf-8");
        return {
          content: [{ type: "text", text: `Screen sincronizado: ${filePath}\n\n${html.slice(0, 500)}...` }],
          structuredContent: { filePath, htmlPreview: html.slice(0, 500) }
        };
      } else {
        const screens = await project.screens();
        const files: string[] = [];
        for (const screen of screens) {
          const html = await resolveHtml(screen);
          const filePath = path.join(outDir, `screen-${screen.screenId}.html`);
          fs.writeFileSync(filePath, html, "utf-8");
          files.push(filePath);
        }
        return {
          content: [{ type: "text", text: `Sincronizados ${screens.length} pantallas a ${outDir}` }],
          structuredContent: { screenCount: screens.length, output: outDir, files }
        };
      }
    } catch (error) {
      return { content: [{ type: "text", text: `Error al sincronizar: ${formatStitchError(error)}` }] };
    }
  }
);

// ─── Tool: stitch_export_framework ────────────────────────────────────

server.registerTool(
  "stitch_export_framework",
  {
    title: "Export to Framework",
    description: "Export a Stitch project to a specific UI framework (React, Vue, Svelte, Next.js, Nuxt, Solid, Angular, or Vanilla HTML). Transforms HTML into framework-specific components.",
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
          const html = screen ? await resolveHtml(screen) : "<div></div>";
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
        const html = await resolveHtml(screen);
        const componentName = `Screen${screen.screenId.slice(0, 8)}`;
        const code = await transformToFramework({ framework, componentName, html });
        results[screen.screenId] = code;
      }

      return {
        content: [{ type: "text", text: `Exportado ${screens.length} pantallas a ${framework} en ${output}` }],
        structuredContent: { framework, output, screenCount: screens.length, components: results }
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error al exportar: ${formatStitchError(error)}` }] };
    }
  }
);

// ─── Tool: stitch_create_design_system ────────────────────────────────

server.registerTool(
  "stitch_create_design_system",
  {
    title: "Create Design System",
    description: "Create a new design system for a Stitch project. Defines visual theme, style guidelines, and design tokens for consistent branding.",
    inputSchema: CreateDesignSystemSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  async ({ projectId, displayName, designTokens, styleGuidelines, theme }) => {
    try {
      const { stitch } = getStitchClient();
      const project = stitch.project(projectId);

      const designSystem = await project.createDesignSystem({
        displayName,
        designTokens,
        styleGuidelines,
        theme: theme as any,
      });

      const dsId = (designSystem as any).assetId || (designSystem as any).id;

      return {
        content: [{
          type: "text",
          text: `Design system creado:\n- Project: ${projectId}\n- Design System ID: ${dsId}\n- Name: ${displayName || "Sin nombre"}\n\nUsa stitch_apply_design_system para aplicarlo a pantallas.`
        }],
        structuredContent: { projectId, designSystemId: dsId, displayName }
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error al crear design system: ${formatStitchError(error)}` }] };
    }
  }
);

// ─── Tool: stitch_list_design_systems ─────────────────────────────────

server.registerTool(
  "stitch_list_design_systems",
  {
    title: "List Design Systems",
    description: "List all design systems for a given Stitch project.",
    inputSchema: ListDesignSystemsSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async ({ projectId }) => {
    try {
      const { stitch } = getStitchClient();
      const project = stitch.project(projectId);
      const designSystems = await project.listDesignSystems();

      if (designSystems.length === 0) {
        return { content: [{ type: "text", text: `No hay design systems en el proyecto ${projectId}` }] };
      }

      const dsList = designSystems.map((ds: any) => ({
        id: ds.assetId || ds.id,
        displayName: ds.data?.displayName || "Sin nombre",
      }));

      const output = `Design Systems (${dsList.length}):\n${dsList.map(ds => `- ${ds.id} (${ds.displayName})`).join("\n")}`;

      return {
        content: [{ type: "text", text: output }],
        structuredContent: { projectId, designSystems: dsList }
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error al listar design systems: ${formatStitchError(error)}` }] };
    }
  }
);

// ─── Tool: stitch_update_design_system ────────────────────────────────

server.registerTool(
  "stitch_update_design_system",
  {
    title: "Update Design System",
    description: "Update an existing design system's theme, tokens, or style guidelines.",
    inputSchema: UpdateDesignSystemSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  async ({ projectId, designSystemId, displayName, designTokens, styleGuidelines, theme }) => {
    try {
      const { stitch } = getStitchClient();
      const project = stitch.project(projectId);
      const ds = project.designSystem(designSystemId);

      const updated = await ds.update({
        displayName,
        designTokens,
        styleGuidelines,
        theme: theme as any,
      });

      return {
        content: [{
          type: "text",
          text: `Design system actualizado:\n- ID: ${designSystemId}\n- Project: ${projectId}`
        }],
        structuredContent: { projectId, designSystemId, updated: true }
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error al actualizar design system: ${formatStitchError(error)}` }] };
    }
  }
);

// ─── Tool: stitch_apply_design_system ─────────────────────────────────

server.registerTool(
  "stitch_apply_design_system",
  {
    title: "Apply Design System to Screens",
    description: "Apply a design system to one or more screens, updating their visual style to match the design system's theme and tokens.",
    inputSchema: ApplyDesignSystemSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  async ({ projectId, designSystemId, screenIds }) => {
    try {
      const { stitch } = getStitchClient();
      const project = stitch.project(projectId);
      const ds = project.designSystem(designSystemId);

      const screens = await ds.apply(screenIds);

      return {
        content: [{
          type: "text",
          text: `Design system aplicado a ${screens.length} pantalla(s):\n${screens.map((s: any) => `  - ${s.screenId}`).join("\n")}`
        }],
        structuredContent: {
          projectId,
          designSystemId,
          updatedScreens: screens.map((s: any) => s.screenId)
        }
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error al aplicar design system: ${formatStitchError(error)}` }] };
    }
  }
);

// ─── Tool: stitch_cache_status ────────────────────────────────────────

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
      return { content: [{ type: "text", text: formatStitchError(error) }] };
    }
  }
);

// ─── Tool: stitch_cache_clear ─────────────────────────────────────────

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
      return { content: [{ type: "text", text: formatStitchError(error) }] };
    }
  }
);

// ─── Tool: stitch_cache_sync ──────────────────────────────────────────

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
        const html = await resolveHtml(screen);
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
      return { content: [{ type: "text", text: formatStitchError(error) }] };
    }
  }
);

// ─── Shutdown ─────────────────────────────────────────────────────────

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
  const credSource = apiKey ? "API key" : "OAuth token";
  logger.info({ credSource }, "Stitch MCP Server started");
}

main().catch((error) => {
  logger.fatal({ error }, "Failed to start MCP server");
  process.exit(1);
});
