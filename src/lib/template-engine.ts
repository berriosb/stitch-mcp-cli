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
