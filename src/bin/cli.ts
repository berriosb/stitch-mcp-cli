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

const program = new Command();

program
  .name("stitch-mcp-cli")
  .description("CLI + MCP proxy para Google Stitch con scaffolding multi-framework")
  .version("0.1.6");

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
  .command("generate")
  .description("Generar pantalla desde prompt")
  .argument("<prompt>", "Prompt de diseño")
  .option("--project-id <id>", "ID del proyecto")
  .option("--device <type>", "Tipo de dispositivo (mobile|desktop|tablet)")
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
