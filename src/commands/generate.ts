import { getStitchClient } from "../lib/stitch-client.js";
import { 
  readMetadata, 
  writeMetadata, 
  initMetadata, 
  updateScreen, 
  type ScreenMetadata 
} from "../lib/metadata.js";
import { GenerateOptionsSchema, validateOrThrow } from "../lib/schemas.js";

type DeviceType = "mobile" | "desktop" | "tablet";
type ModelId = "GEMINI_3_PRO" | "GEMINI_3_FLASH" | "GEMINI_3_1_PRO";

export async function generate(
  prompt: string,
  options: { projectId?: string; device?: DeviceType; modelId?: ModelId; name?: string }
) {
  if (!prompt) {
    console.error("Error: prompt requerido");
    console.error("Usage: stitch-mcp-cli generate <prompt> [--project-id <id>] [--device mobile|desktop|tablet] [--model-id <model>] [--name <screen-name>]");
    process.exit(1);
  }

  const validated = validateOrThrow(GenerateOptionsSchema, options);

  try {
    const { stitch, callTool } = getStitchClient();
    let project;
    let projectId = validated.projectId;

    if (projectId) {
      project = stitch.project(projectId);
      console.log(`Usando proyecto: ${projectId}`);
    } else {
      const metadata = readMetadata();
      if (metadata?.projectId) {
        projectId = metadata.projectId;
        project = stitch.project(projectId);
        console.log(`Usando proyecto desde metadata: ${projectId}`);
      } else {
        const projects = await stitch.projects();
        if (projects.length === 0) {
          console.error("No hay proyectos. Crea uno primero con: stitch-mcp-cli create-project --title <nombre>");
          process.exit(1);
        }
        project = projects[0];
        projectId = project.id;
        console.log(`Usando proyecto: ${projectId}`);
      }
    }

    let metadata = readMetadata();
    if (!metadata || metadata.projectId !== projectId) {
      console.log("Inicializando metadata para el proyecto...");
      const projectDetails = await callTool("get_project", { name: `projects/${projectId}` }) as any;
      metadata = initMetadata(projectId, {
        title: projectDetails?.title || "Untitled",
        deviceType: projectDetails?.deviceType || "MOBILE",
        designTheme: projectDetails?.designTheme,
      });
    }

    console.log("Generando pantalla...");
    const deviceType = validated.device?.toUpperCase() as "MOBILE" | "DESKTOP" | "TABLET" | "AGNOSTIC" | "DEVICE_TYPE_UNSPECIFIED" | undefined;
    const modelId = validated.modelId as "GEMINI_3_PRO" | "GEMINI_3_FLASH" | "GEMINI_3_1_PRO" | "MODEL_ID_UNSPECIFIED" | undefined;
    const screen = await project.generate(prompt, deviceType, modelId);

    const screenName = validated.name || `screen_${Date.now()}`;
    const screenMetadata: ScreenMetadata = {
      id: screen.screenId,
      sourceScreen: `projects/${projectId}/screens/${screen.screenId}`,
      x: 0,
      y: 0,
      width: 390,
      height: 844,
    };

    updateScreen(screenName, screenMetadata);

    console.log(`\nOK Pantalla generada`);
    console.log(`   Project ID: ${screen.projectId}`);
    console.log(`   Screen ID: ${screen.screenId}`);
    console.log(`   Screen Name: ${screenName}`);
    if (validated.modelId) console.log(`   Model: ${validated.modelId}`);
    console.log(`   Metadata actualizada: .stitch/metadata.json`);
    console.log("\nPara obtener el HTML:");
    console.log(`   stitch-mcp-cli sync ${screen.projectId} ${screen.screenId}`);
  } catch (error) {
    console.error("Error al generar:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
