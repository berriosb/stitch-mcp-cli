import fs from "fs";
import path from "path";
import { getStitchClient } from "../lib/stitch-client.js";
import { resolveHtml } from "../lib/resolve-html.js";
import {
  transformToFramework,
  renderStorybookStory,
  getStorybookExtension,
  isStorybookSupportedFramework,
  getStorybookSupportedFrameworks,
} from "../lib/template-engine.js";
import { getExtension, isValidFramework } from "../lib/framework-mapper.js";

export async function storybook(
  projectId: string,
  options: { framework?: string; output?: string; routes?: string }
) {
  if (!projectId) {
    console.error(
      "Usage: stitch-mcp-cli storybook <project-id> --framework react --output ./stories"
    );
    process.exit(1);
  }

  const framework = (options.framework || "react").toLowerCase();
  const outputDir = options.output || "./stitch-stories";

  if (!isValidFramework(framework)) {
    console.error(`Framework inválido: ${framework}`);
    console.error(`Frameworks válidos: ${getStorybookSupportedFrameworks().join(", ")}`);
    process.exit(1);
  }
  if (!isStorybookSupportedFramework(framework)) {
    console.error(
      `Framework "${framework}" no soportado para Storybook export. Soportados: ${getStorybookSupportedFrameworks().join(", ")}`
    );
    process.exit(1);
  }

  try {
    const { stitch } = getStitchClient();
    const project = stitch.project(projectId);
    const screens = await project.screens();

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Generando Storybook stories para ${screens.length} pantallas en ${framework}...`);

    let written = 0;
    for (const screen of screens) {
      const html = await resolveHtml(screen);
      const componentName = `Stitch${screen.screenId.slice(0, 8)}`;
      const compExt = getExtension(framework);
      const componentCode = await transformToFramework({
        framework,
        componentName,
        html,
      });
      const componentPath = path.join(outputDir, `${componentName}.${compExt}`);
      fs.writeFileSync(componentPath, componentCode);

      const storyCode = await renderStorybookStory({ framework, componentName });
      const storyExt = getStorybookExtension(framework);
      const storyPath = path.join(outputDir, `${componentName}.${storyExt}`);
      fs.writeFileSync(storyPath, storyCode);

      written += 1;
    }

    // Write a minimal .storybook preview configuration if it doesn't exist
    const storybookDir = path.join(outputDir, ".storybook");
    if (!fs.existsSync(storybookDir)) {
      fs.mkdirSync(storybookDir, { recursive: true });
      const preview = renderPreview(framework);
      fs.writeFileSync(path.join(storybookDir, "preview.ts"), preview);
      const main = renderMain(framework);
      fs.writeFileSync(path.join(storybookDir, "main.ts"), main);
    }

    console.log(`OK Generadas ${written} stories en ${outputDir}`);
    console.log(`   Framework: ${framework}`);
    console.log(`   Próximo paso: cd ${outputDir} && npx storybook@latest init && npx storybook dev`);
  } catch (error) {
    console.error(
      "Error al generar Storybook:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

function renderPreview(framework: string): string {
  const base = `import type { Preview } from "@storybook/${
    framework === "nextjs" ? "react" : framework === "nuxt" ? "vue3" : framework
  }";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
`;
  return base;
}

function renderMain(framework: string): string {
  return `import type { StorybookConfig } from "@storybook/${
    framework === "nextjs" ? "react" : framework === "nuxt" ? "vue3" : framework
  }-vite";

const config: StorybookConfig = {
  stories: ["../**/*.stories.@(ts|tsx|svelte)"],
  addons: [],
  framework: {
    name: "${
      framework === "nextjs" ? "@storybook/react-vite" : `@storybook/${framework}-vite`
    }",
    options: {},
  },
};

export default config;
`;
}
