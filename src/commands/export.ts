import fs from "fs";
import path from "path";
import type { Screen } from "@google/stitch-sdk";
import { getStitchClient } from "../lib/stitch-client.js";
import { resolveHtml } from "../lib/resolve-html.js";
import { transformToFramework } from "../lib/template-engine.js";
import { getExtension, getSupportedFrameworks, isValidFramework } from "../lib/framework-mapper.js";

function routeToFilePath(route: string): string {
  if (route === "/") return "page.tsx";
  const clean = route.replace(/^\//, "").replace(/\/$/, "");
  const parts = clean.split("/");
  return [...parts, "page.tsx"].join("/");
}

function parseRoutes(routesStr: string): string[] {
  return routesStr.split(",").map((r) => r.trim());
}

function parseRouteScreenMap(
  routesStr: string
): Array<{ route: string; screenId?: string }> {
  return routesStr.split(",").map((raw) => {
    const [route, screenId] = raw.split("=").map((s) => s.trim());
    return { route, screenId: screenId || undefined };
  });
}

export async function exportCmd(
  projectId: string,
  options: { framework?: string; output?: string; routes?: string }
) {
  if (!projectId) {
    console.error("Usage: stitch-mcp-cli export <project-id> --framework react --output ./components");
    process.exit(1);
  }

  const framework = (options.framework || "react").toLowerCase();
  const outputDir = options.output || "./stitch-export";
  const routesStr = options.routes;

  if (!isValidFramework(framework)) {
    console.error(`Framework inválido: ${framework}`);
    console.error(`Frameworks válidos: ${getSupportedFrameworks().join(", ")}`);
    process.exit(1);
  }

  try {
    const { stitch } = getStitchClient();
    const project = stitch.project(projectId);
    const screens = await project.screens();

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Exportando ${screens.length} pantallas a ${framework}...`);

    if (framework === "nextjs" && routesStr) {
      const entries = parseRouteScreenMap(routesStr);
      console.log(`   Rutas especificadas: ${entries.length}`);

      const screensById = new Map<string, Screen>();
      for (const s of screens) screensById.set(s.screenId, s);

      for (let i = 0; i < entries.length; i++) {
        const { route, screenId } = entries[i];
        let screen: Screen | undefined = screenId ? screensById.get(screenId) : undefined;
        if (!screen) {
          // Fallback to round-robin distribution across available screens
          screen = screens.length > 0 ? screens[i % screens.length] : undefined;
        }
        const html = screen ? await resolveHtml(screen) : "<div></div>";
        const componentName = `Page${route.replace(/[\/\-]/g, "_") || "Home"}`;
        const code = await transformToFramework({ framework, componentName, html });

        const relativePath = routeToFilePath(route);
        const filePath = path.join(outputDir, relativePath);
        const fileDir = path.dirname(filePath);

        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }

        fs.writeFileSync(filePath, code);
      }

      console.log(`OK Exportado ${entries.length} rutas a ${outputDir}`);
      console.log(`   Framework: ${framework}`);
    } else {
      for (const screen of screens) {
        const html = await resolveHtml(screen);
        const componentName = `Screen${screen.screenId.slice(0, 8)}`;
        const code = await transformToFramework({ framework, componentName, html });
        const ext = getExtension(framework);
        const filePath = path.join(outputDir, `${componentName}.${ext}`);
        fs.writeFileSync(filePath, code);
      }

      console.log(`OK Exportado ${screens.length} archivos a ${outputDir}`);
      console.log(`   Framework: ${framework}`);
    }
  } catch (error) {
    console.error("Error al exportar:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
