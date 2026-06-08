#!/usr/bin/env node
import { Command } from "commander";
import { auth } from "../commands/auth.js";
import { setup } from "../commands/setup.js";
import { projects } from "../commands/projects.js";
import { generate } from "../commands/generate.js";
import { sync } from "../commands/sync.js";
import { exportCmd } from "../commands/export.js";
import { watch } from "../commands/watch.js";
import { cache } from "../commands/cache.js";
import { evalCmd } from "../commands/eval.js";
import { designMd } from "../commands/design-md.js";
import { createProject } from "../commands/create-project.js";
import { upload } from "../commands/upload.js";
import { closeStitchClient } from "../lib/stitch-client.js";

let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.error(`\n${signal}, cerrando...`);
  await closeStitchClient();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

if (process.argv.length <= 2 && !process.stdin.isTTY) {
  import("../index.js");
} else {
  const program = new Command();

  program
    .name("stitch-mcp-cli")
    .description("CLI + MCP proxy para Google Stitch con scaffolding multi-framework")
    .version("0.2.0");

  program
    .command("auth")
    .description("Configurar API key")
    .option("--api-key <key>", "API key de Stitch")
    .option("--check", "Verificar API key existente")
    .action(auth as any);

  program.command("setup").description("Configurar IDEs").action(setup as any);

  program
    .command("projects")
    .description("Listar proyectos")
    .option("--json", "Output en formato JSON")
    .option("--search <term>", "Filtrar por nombre")
    .option("--offline", "Modo offline")
    .action(projects as any);

  program
    .command("create-project")
    .description("Crear un nuevo proyecto en Stitch")
    .option("--title <title>", "Título del proyecto")
    .action(createProject as any);

  program
    .command("generate")
    .description("Generar pantalla desde prompt")
    .argument("<prompt>", "Prompt de diseño")
    .option("--project-id <id>", "ID del proyecto")
    .option("--device <type>", "Tipo de dispositivo (mobile|desktop|tablet)")
    .option("--model-id <model>", "Modelo a usar (GEMINI_3_PRO|GEMINI_3_FLASH|GEMINI_3_1_PRO)")
    .option("--name <name>", "Nombre de la pantalla")
    .action(generate as any);

  program
    .command("sync")
    .description("Sync a archivos")
    .argument("[project-id]", "ID del proyecto")
    .argument("[screen-id]", "ID de la pantalla")
    .option("--output <dir>", "Directorio de salida")
    .action(sync as any);

  program
    .command("export")
    .description("Exportar a framework")
    .argument("<project-id>", "ID del proyecto")
    .option("--framework <name>", "Framework destino (react|vue|svelte|nextjs|nuxt|solid|angular|vanilla)")
    .option("--output <dir>", "Directorio de salida")
    .option("--routes <routes>", "Rutas para Next.js (separadas por coma)")
    .action(exportCmd as any);

  program.command("watch").description("Watch mode").action(watch as any);

  program
    .command("upload")
    .description("Subir imagen o archivo HTML a un proyecto")
    .argument("<project-id>", "ID del proyecto")
    .argument("<file>", "Ruta del archivo (PNG, JPG, WEBP, HTML)")
    .option("--title <title>", "Título para la pantalla")
    .option("--no-create-screen-instances", "No crear instancias de pantalla")
    .action(upload as any);

  program
    .command("cache")
    .description("Gestionar caché")
    .option("--status", "Ver estado de caché")
    .option("--clear", "Limpiar caché")
    .option("--sync <project-id>", "Sincronizar proyecto a caché")
    .action(cache as any);

  program
    .command("eval")
    .description("Ejecutar evaluaciones MCP")
    .option("--file <path>", "Archivo de evaluación")
    .option("--results", "Guardar resultados en JSON")
    .action(evalCmd as any);

  program
    .command("design-md")
    .description("Extraer design system a DESIGN.md")
    .option("--project-id <id>", "ID del proyecto")
    .option("--output <file>", "Archivo de salida")
    .option("--sync", "Sincronizar pantallas")
    .action(designMd as any);

  program.parse();
}
