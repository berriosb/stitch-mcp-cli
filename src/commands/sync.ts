import fs from "fs";
import path from "path";
import { getStitchClient } from "../lib/stitch-client.js";

/**
 * Sync screens from Stitch project to local HTML files
 * @param projectId - Stitch project ID
 * @param screenId - Optional specific screen ID (syncs all if not provided)
 * @param options.output - Output directory (default: ./stitch-output)
 */
export async function sync(
  projectId: string,
  screenId?: string,
  options: { output?: string } = {}
) {
  const outputDir = options.output || "./stitch-output";

  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (!projectId) {
      console.error("Error: projectId requerido");
      console.error("Usage: stitch-mcp-cli sync <project-id> [screen-id] [--output <dir>]");
      process.exit(1);
    }

    const { stitch } = getStitchClient();
    const project = stitch.project(projectId);

    if (screenId) {
      const screen = await project.getScreen(screenId);
      const html = await screen.getHtml();

      const filePath = path.join(outputDir, `screen-${screenId}.html`);
      fs.writeFileSync(filePath, html);

      console.log(`OK Pantalla guardada: ${filePath}`);
    } else {
      const screens = await project.screens();
      console.log(`Sincronizando ${screens.length} pantallas...`);

      for (const screen of screens) {
        const html = await screen.getHtml();
        const filePath = path.join(outputDir, `screen-${screen.screenId}.html`);
        fs.writeFileSync(filePath, html);
      }

      console.log(`OK ${screens.length} pantallas guardadas en ${outputDir}`);
    }
  } catch (error) {
    console.error("Error al sincronizar:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
