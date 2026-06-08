import path from "path";
import fs from "fs";
import { getStitchClient, StitchError } from "../lib/stitch-client.js";

export async function upload(options: { projectId: string; file: string; title?: string; createScreenInstances?: boolean }) {
  const filePath = path.resolve(options.file);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: archivo no encontrado: ${filePath}`);
    process.exit(1);
  }

  const ext = path.extname(filePath).toLowerCase();
  const supportedExts = [".png", ".jpg", ".jpeg", ".webp", ".html", ".htm"];
  if (!supportedExts.includes(ext)) {
    console.error(`Error: formato no soportado "${ext}". Formatos válidos: ${supportedExts.join(", ")}`);
    process.exit(1);
  }

  try {
    const { stitch } = getStitchClient();
    const project = stitch.project(options.projectId);

    console.log(`Subiendo ${path.basename(filePath)} al proyecto ${options.projectId}...`);

    const screens = await project.upload(filePath, {
      title: options.title,
      createScreenInstances: options.createScreenInstances ?? true,
    });

    console.log(`\nOK ${screens.length} pantalla(s) creada(s) desde el archivo`);
    for (const screen of screens) {
      console.log(`   Screen ID: ${screen.screenId}`);
    }
  } catch (error) {
    if (error instanceof StitchError) {
      console.error(`Error [${error.code}]: ${error.message}`);
      if (error.suggestion) console.error(`Sugerencia: ${error.suggestion}`);
    } else {
      console.error("Error al subir archivo:", error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
