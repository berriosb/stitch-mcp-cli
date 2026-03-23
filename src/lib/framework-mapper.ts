import type { Framework } from "../types/index.js";

export const FRAMEWORK_MAP: Record<string, Framework> = {
  react: { name: "React", ext: "tsx", componentType: "tsx" },
  nextjs: { name: "Next.js", ext: "tsx", componentType: "tsx" },
  nuxt: { name: "Nuxt", ext: "vue", componentType: "vue" },
  vue: { name: "Vue", ext: "vue", componentType: "vue" },
  svelte: { name: "Svelte", ext: "svelte", componentType: "svelte" },
  solid: { name: "Solid", ext: "tsx", componentType: "tsx" },
  angular: { name: "Angular", ext: "ts", componentType: "ts" },
  vanilla: { name: "Vanilla HTML", ext: "html", componentType: "html" },
};

export function getFramework(name: string): Framework | null {
  const key = name.toLowerCase();
  return FRAMEWORK_MAP[key] || null;
}

export function getExtension(framework: string): string {
  const fw = getFramework(framework);
  return fw?.ext || "html";
}

export function getComponentType(framework: string): string {
  const fw = getFramework(framework);
  return fw?.componentType || "html";
}

export function isValidFramework(name: string): boolean {
  return name.toLowerCase() in FRAMEWORK_MAP;
}

export function getSupportedFrameworks(): string[] {
  return Object.keys(FRAMEWORK_MAP);
}
