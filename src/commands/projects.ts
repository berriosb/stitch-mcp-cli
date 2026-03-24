import { getStitchClient } from "../lib/stitch-client.js";
import { SqliteCacheManager } from "../lib/sqlite-cache-manager.js";
import { isOnline } from "../lib/network.js";
import { ProjectsOptionsSchema, validateOrThrow } from "../lib/schemas.js";

export async function projects(options: { json?: boolean; search?: string; offline?: boolean }) {
  const validated = validateOrThrow(ProjectsOptionsSchema, options);
  const online = await isOnline();

  if (!online && validated.offline) {
    const cm = new SqliteCacheManager();
    const cached = await cm.listProjects();
    
    if (validated.json) {
      console.log(JSON.stringify(cached, null, 2));
      return;
    }

    if (cached.length === 0) {
      console.log("No hay proyectos en caché.");
      console.log("   Usa 'stitch-mcp-cli projects' con conexion a internet para sincronizar.");
      return;
    }

    console.log(`[C] Modo offline - Proyectos en cache (${cached.length}):\n`);
    for (const project of cached) {
      console.log(`  ${project.name}`);
      console.log(`  ID: ${project.id}`);
      console.log(`  Pantallas: ${project.screens.length}\n`);
    }
    return;
  }

  if (!online) {
    console.log("! Sin conexion a internet.");
    console.log("   Usa --offline para ver proyectos en caché.");
    console.log("   O conecta a internet y ejecuta 'stitch-mcp-cli cache --sync <project-id>'");
    process.exit(1);
  }

  try {
    const { stitch } = getStitchClient();
    const allProjects = await stitch.projects();

    let filtered = allProjects;
    if (validated.search) {
      const search = validated.search.toLowerCase();
      filtered = allProjects.filter((p) =>
        p.id.toLowerCase().includes(search)
      );
    }

    if (validated.json) {
      console.log(JSON.stringify(filtered, null, 2));
      return;
    }

    if (filtered.length === 0) {
      console.log("No hay proyectos.");
      console.log("   Crea uno en https://stitch.withgoogle.com");
      return;
    }

    console.log(`Proyectos (${filtered.length}):\n`);
    for (const project of filtered) {
      console.log(`  ID: ${project.id}`);
      console.log(`  Project ID: ${project.projectId}\n`);
    }
  } catch (error) {
    console.error("Error al obtener proyectos:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
