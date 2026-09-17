import fs from "fs";
import path from "path";
import ejs from "ejs";
import { isValidFramework } from "./framework-mapper.js";
import { loadConfig } from "./config.js";

export interface TransformOptions {
  framework: string;
  componentName: string;
  html: string;
  css?: string;
}

export interface StorybookStoryOptions {
  framework: string;
  componentName: string;
}

const STORYBOOK_FRAMEWORKS = new Set([
  "react",
  "nextjs",
  "vue",
  "nuxt",
  "svelte",
  "sveltekit",
]);

const STORYBOOK_TEMPLATE_MAP: Record<string, string> = {
  react: "storybook/react.story.ejs",
  nextjs: "storybook/nextjs.story.ejs",
  vue: "storybook/vue.story.ejs",
  nuxt: "storybook/nuxt.story.ejs",
  svelte: "storybook/svelte.story.ejs",
  sveltekit: "storybook/sveltekit.story.ejs",
};

const FRAMEWORK_DISPLAY_NAMES: Record<string, string> = {
  react: "React",
  nextjs: "Next.js",
  vue: "Vue 3",
  nuxt: "Nuxt 3",
  svelte: "Svelte 5",
  sveltekit: "SvelteKit",
};

function getUserTemplatePath(framework: string): string | null {
  const config = loadConfig();
  if (config.templateDir) {
    return path.join(config.templateDir, framework, "component.ejs");
  }
  return null;
}

export async function transformToFramework(options: TransformOptions): Promise<string> {
  const { framework, componentName, html, css } = options;
  const fw = framework.toLowerCase();

  if (!isValidFramework(fw)) {
    throw new Error(`Framework no soportado: ${framework}`);
  }

  const userTemplate = getUserTemplatePath(fw);
  if (userTemplate && fs.existsSync(userTemplate)) {
    const template = fs.readFileSync(userTemplate, "utf-8");
    return ejs.render(template, { componentName, html, css }, { async: true });
  }

  return renderFallback(fw, componentName, html, css);
}

function renderFallback(framework: string, name: string, html: string, css?: string): string {
  switch (framework) {
    case "react": {
      const jsx = htmlToJsx(html);
      return `import React from 'react';

interface ${name}Props {
  className?: string;
}

export function ${name}({ className = '' }: ${name}Props) {
  return (
    <div className={\`\${className} ${name.toLowerCase()}\`}>
      <style>{\`${escapeCss(css || "")}\`}</style>
      ${jsx}
    </div>
  );
}
`;
    }
    case "vue": {
      const componentNameKebab = name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
      return `<template>
  <div class="${componentNameKebab}">
    <style>${css || ""}</style>
    ${html}
  </div>
</template>

<script setup lang="ts">
interface Props {
  className?: string;
}

withDefaults(defineProps<Props>(), {
  className: '',
});
</script>
`;
    }
    case "svelte":
      return `<script setup lang="ts">
interface Props {
  className?: string;
}

let { className = '' }: Props = $props();
</script>

<style>
${css || ""}
</style>

<div class="${name.toLowerCase()} {className}">
  ${html}
</div>
`;
    case "nextjs": {
      const jsx = htmlToJsx(html);
      return `export default function ${name}({ className = '' }: { className?: string }) {
  return (
    <div className={\`\${className} ${name.toLowerCase()}\`}>
      <style jsx>{\`${escapeCss(css || "")}\`}</style>
      ${jsx}
    </div>
  );
}
`;
    }
    case "nuxt": {
      const componentNameKebab = name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
      return `<template>
  <div class="${componentNameKebab}">
    <style>${css || ""}</style>
    ${html}
  </div>
</template>

<script setup lang="ts">
interface Props {
  className?: string;
}

withDefaults(defineProps<Props>(), {
  className: '',
});
</script>
`;
    }
    case "solid": {
      return `import { Component, JSX } from 'solid-js';

interface ${name}Props {
  class?: string;
}

export const ${name}: Component<${name}Props> = (props): JSX.Element => {
  return (
    <div class={\`\${props.class || ''} ${name.toLowerCase()}\`}>
      <style>{\`${escapeCss(css || "")}\`}</style>
      ${html}
    </div>
  );
};
`;
    }
    case "angular": {
      const componentNameKebab = name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
      return `import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-${componentNameKebab}',
  template: \`
    <div class="${name.toLowerCase()}">
      <style>${css || ""}</style>
      ${html}
    </div>
  \`,
  styles: [],
  standalone: true
})
export class ${name}Component {
  @Input() className: string = '';
}
`;
    }
    case "vanilla":
    default:
      return html;
  }
}

function htmlToJsx(html: string): string {
  return html
    .replace(/class=/g, "className=")
    .replace(/for=/g, "htmlFor=")
    .replace(/onclick=/g, "onClick=")
    .replace(/onchange=/g, "onChange=")
    .replace(/ondoubleclick=/g, "onDoubleClick=");
}

function escapeCss(css: string): string {
  return css.replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

function getStorybookTemplatePath(framework: string): string | null {
  const userTemplate = getUserTemplatePath(framework);
  if (userTemplate) return userTemplate;
  const rel = STORYBOOK_TEMPLATE_MAP[framework];
  if (!rel) return null;
  // Resolve relative to the package root so it works both in src and dist
  const url = new URL(`../templates/${rel}`, import.meta.url);
  return url.pathname;
}

export function isStorybookSupportedFramework(framework: string): boolean {
  return STORYBOOK_FRAMEWORKS.has(framework.toLowerCase());
}

export function getStorybookSupportedFrameworks(): string[] {
  return Array.from(STORYBOOK_FRAMEWORKS);
}

export async function renderStorybookStory(options: StorybookStoryOptions): Promise<string> {
  const { framework, componentName } = options;
  const fw = framework.toLowerCase();
  if (!isStorybookSupportedFramework(fw)) {
    throw new Error(
      `Storybook export no soportado para framework: ${framework}. Soportados: ${getStorybookSupportedFrameworks().join(", ")}`
    );
  }
  const templatePath = getStorybookTemplatePath(fw);
  if (!templatePath || !fs.existsSync(templatePath)) {
    throw new Error(`Storybook template no encontrado para ${framework}`);
  }
  const template = fs.readFileSync(templatePath, "utf-8");
  return ejs.render(
    template,
    { componentName, frameworkName: FRAMEWORK_DISPLAY_NAMES[fw] || framework },
    { async: true }
  );
}

export function getStorybookExtension(framework: string): string {
  switch (framework.toLowerCase()) {
    case "react":
    case "nextjs":
    case "sveltekit":
      return "stories.tsx";
    case "vue":
    case "nuxt":
      return "stories.ts";
    case "svelte":
      return "stories.svelte";
    default:
      return "stories.ts";
  }
}
