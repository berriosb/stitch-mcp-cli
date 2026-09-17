import { describe, it, expect } from "vitest";
import {
  renderStorybookStory,
  isStorybookSupportedFramework,
  getStorybookSupportedFrameworks,
  getStorybookExtension,
} from "../../src/lib/template-engine.js";

describe("Storybook template engine", () => {
  it("supports the expected framework set", () => {
    const supported = getStorybookSupportedFrameworks();
    expect(supported).toContain("react");
    expect(supported).toContain("nextjs");
    expect(supported).toContain("vue");
    expect(supported).toContain("nuxt");
    expect(supported).toContain("svelte");
    expect(supported).toContain("sveltekit");
    expect(supported).not.toContain("angular");
    expect(supported).not.toContain("vanilla");
  });

  it("isStorybookSupportedFramework rejects unsupported", () => {
    expect(isStorybookSupportedFramework("react")).toBe(true);
    expect(isStorybookSupportedFramework("angular")).toBe(false);
    expect(isStorybookSupportedFramework("vanilla")).toBe(false);
  });

  it("renders a React story file with the expected imports and meta", async () => {
    const code = await renderStorybookStory({
      framework: "react",
      componentName: "Stitchabcd1234",
    });
    expect(code).toContain('import type { Meta, StoryObj } from "@storybook/react"');
    expect(code).toContain('import { Stitchabcd1234 } from "./Stitchabcd1234"');
    expect(code).toContain('title: "Stitch/Stitchabcd1234"');
    expect(code).toContain("tags: [\"autodocs\"]");
  });

  it("renders a Vue story file with the expected shape", async () => {
    const code = await renderStorybookStory({
      framework: "vue",
      componentName: "Stitchabcd1234",
    });
    expect(code).toContain('import type { Meta, StoryObj } from "@storybook/vue3"');
    expect(code).toContain('import Stitchabcd1234 from "./Stitchabcd1234.vue"');
  });

  it("renders a Svelte story file", async () => {
    const code = await renderStorybookStory({
      framework: "svelte",
      componentName: "Stitchabcd1234",
    });
    expect(code).toContain('import type { Meta, StoryObj } from "@storybook/svelte"');
    expect(code).toContain('import Stitchabcd1234 from "./Stitchabcd1234.svelte"');
  });

  it("throws on unsupported framework", async () => {
    await expect(
      renderStorybookStory({ framework: "angular", componentName: "X" })
    ).rejects.toThrow(/no soportado/);
  });

  it("getStorybookExtension returns correct extensions", () => {
    expect(getStorybookExtension("react")).toBe("stories.tsx");
    expect(getStorybookExtension("nextjs")).toBe("stories.tsx");
    expect(getStorybookExtension("vue")).toBe("stories.ts");
    expect(getStorybookExtension("nuxt")).toBe("stories.ts");
    expect(getStorybookExtension("svelte")).toBe("stories.svelte");
    expect(getStorybookExtension("sveltekit")).toBe("stories.tsx");
  });
});
