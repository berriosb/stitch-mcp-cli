import { getStitchClient } from "../lib/stitch-client.js";
import { getCache } from "../lib/cache.js";
import type { CachedProject, CachedScreen } from "../types/index.js";

/**
 * Manage local cache for offline access
 * @param options.status - Show cache status
 * @param options.clear - Clear all cached data
 * @param options.sync - Sync project to cache by ID
 */
export async function cache(options: { status?: boolean; clear?: boolean; sync?: string }) {
  const cm = await getCache();

  if (options.clear) {
    await cm.clearCache();
    console.log("OK Cache eliminada");
    return;
  }

  if (options.status) {
    const size = cm.getCacheSize();
    const projects = await cm.listProjects();

    console.log("[C] Estado de cache:\n");
    console.log(`   Proyectos cacheados: ${size.projectCount}`);
    console.log(`   Pantallas cacheadas: ${size.screenCount}`);
    console.log(`   Tamaño: ${(size.sizeBytes / 1024).toFixed(2)} KB`);
    console.log(`   Ubicación: ${cm.getCacheDir()}`);

    if (projects.length > 0) {
      console.log("\n   Proyectos:");
      for (const project of projects) {
        console.log(`   - ${project.name} (${project.screens.length} pantallas)`);
      }
    }
    return;
  }

  if (options.sync) {
    const projectId = options.sync;
    console.log(`Sincronizando proyecto ${projectId} a caché...`);

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

      await cm.saveProject(cachedProject);

      console.log(`OK ${screens.length} pantallas cacheadas`);
    } catch (error) {
      console.error("Error al sincronizar:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
    return;
  }

  console.log("Usage: stitch-mcp-cli cache [--status|--clear|--sync <project-id>]");
  console.log("\nOpciones:");
  console.log("  --status      Ver estado de caché");
  console.log("  --clear       Eliminar toda la caché");
  console.log("  --sync <id>   Sincronizar proyecto a caché");
}
