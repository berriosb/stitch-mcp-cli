import { getStitchClient, StitchError } from "../lib/stitch-client.js";

export async function createProject(options: { title?: string }) {
  try {
    const { stitch } = getStitchClient();

    console.log("Creando proyecto...");
    const project = await stitch.createProject(options.title);

    console.log(`\nOK Proyecto creado`);
    console.log(`   Project ID: ${project.projectId}`);
    console.log(`   Title: ${options.title || project.data?.title || "Sin título"}`);
    console.log("\nPara generar pantallas:");
    console.log(`   stitch-mcp-cli generate "Mi diseño" --project-id ${project.projectId}`);
  } catch (error) {
    if (error instanceof StitchError) {
      console.error(`Error [${error.code}]: ${error.message}`);
      if (error.suggestion) console.error(`Sugerencia: ${error.suggestion}`);
    } else {
      console.error("Error al crear proyecto:", error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
