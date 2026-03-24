import fs from "fs";
import path from "path";
import { getStitchClient } from "../lib/stitch-client.js";
import { transformToFramework } from "../lib/template-engine.js";

type Framework = "react" | "vue" | "svelte" | "nextjs" | "vanilla";

function routeToFilePath(route: string): string {
  if (route === "/") return "page.tsx";
  const clean = route.replace(/^\//, "").replace(/\/$/, "");
  const parts = clean.split("/");
  return [...parts, "page.tsx"].join("/");
}

function parseRoutes(routesStr: string): string[] {
  return routesStr.split(",").map((r) => r.trim());
}

export async function exportCmd(
  projectId: string,
  options: { framework?: string; output?: string; routes?: string }
) {
  if (!projectId) {
    console.error("Usage: stitch-mcp-cli export <project-id> --framework react --output ./components");
    process.exit(1);
  }

  const framework = (options.framework || "react").toLowerCase() as Framework;
  const outputDir = options.output || "./stitch-export";
  const routesStr = options.routes;
  const validFrameworks: Framework[] = ["react", "vue", "svelte", "nextjs", "vanilla"];

  if (!validFrameworks.includes(framework)) {
    console.error(`Framework inválido: ${framework}`);
    console.error(`Frameworks válidos: ${validFrameworks.join(", ")}`);
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
      const routes = parseRoutes(routesStr);
      console.log(`   Rutas especificadas: ${routes.join(", ")}`);

      for (const route of routes) {
        const screen = screens.length > 0 ? screens[0] : null;
        const html = screen ? await screen.getHtml() : "<div></div>";
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

      console.log(`OK Exportado ${routes.length} rutas a ${outputDir}`);
      console.log(`   Framework: ${framework}`);
    } else {
      for (const screen of screens) {
        const html = await screen.getHtml();
        const componentName = `Screen${screen.screenId.slice(0, 8)}`;
        const code = await transformToFramework({ framework, componentName, html });

        let ext: string;
        switch (framework) {
          case "react":
          case "nextjs":
            ext = "tsx";
            break;
          case "vue":
            ext = "vue";
            break;
          case "svelte":
            ext = "svelte";
            break;
          default:
            ext = "html";
        }

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
