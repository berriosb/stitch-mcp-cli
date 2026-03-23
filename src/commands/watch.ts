import fs from "fs";
import path from "path";
import { getStitchClient } from "../lib/stitch-client.js";
import { transformToFramework } from "../lib/template-engine.js";
import { loadConfig } from "../lib/config.js";
import { getFramework } from "../lib/framework-mapper.js";

export async function watch(
  projectId: string,
  options: { output?: string; framework?: string; interval?: number } = {}
) {
  if (!projectId) {
    console.error("Usage: stitch-mcp-cli watch <project-id> --output ./src --framework react [--interval 5000]");
    process.exit(1);
  }

  const config = loadConfig();
  const outputDir = options.output || "./stitch-watch";
  const framework = options.framework || "react";
  const intervalMs = options.interval || config.watchInterval || 5000;

  const fw = getFramework(framework);
  if (!fw) {
    console.error(`Framework inválido: ${framework}`);
    process.exit(1);
  }

  console.log(`👀 Watching project ${projectId} for changes...`);
  console.log(`   Output: ${outputDir}`);
  console.log(`   Framework: ${framework}`);
  console.log(`   Interval: ${intervalMs}ms`);
  console.log(`   Press Ctrl+C to stop\n`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const { stitch } = getStitchClient();
  const project = stitch.project(projectId);
  let lastScreenCount = 0;
  let lastScreenIds: string[] = [];

  const syncScreens = async () => {
    try {
      const screens = await project.screens();
      const currentIds = screens.map((s) => s.screenId);

      const newScreens = screens.filter((s) => !lastScreenIds.includes(s.screenId));

      if (screens.length !== lastScreenCount || newScreens.length > 0) {
        console.log(`📱 ${screens.length} screens detected`);

        for (const screen of screens) {
          const html = await screen.getHtml();
          const componentName = `Screen${screen.screenId.slice(0, 8)}`;
          const code = await transformToFramework({ framework, componentName, html });

          const ext = fw.ext;
          const filePath = path.join(outputDir, `${componentName}.${ext}`);
          fs.writeFileSync(filePath, code);
        }

        console.log(`✅ Synced ${screens.length} screens\n`);
        lastScreenCount = screens.length;
        lastScreenIds = currentIds;
      }
    } catch (error) {
      console.error("Watch error:", error instanceof Error ? error.message : error);
    }
  };

  await syncScreens();

  const interval = setInterval(syncScreens, intervalMs);

  process.on("SIGINT", () => {
    clearInterval(interval);
    console.log("\n\n👋 Stopped watching");
    process.exit(0);
  });
}
