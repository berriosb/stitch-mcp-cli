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
  .version("0.1.0");

program.command("auth").description("Configurar API key").action(auth as any);
program.command("setup").description("Configurar IDEs").action(setup as any);
program.command("projects").description("Listar proyectos").action(projects as any);
program.command("generate").description("Generar pantalla").action(generate as any);
program.command("sync").description("Sync a archivos").action(sync as any);
program.command("export").description("Exportar a framework").action(exportCmd as any);
program.command("watch").description("Watch mode").action(watch as any);
program.command("cache").description("Gestionar caché").action(cache as any);
program.command("eval").description("Ejecutar evaluaciones MCP").action(evalCmd as any);
program.command("design-md").description("Extraer design system a DESIGN.md").action(designMd as any);

program.parse();
