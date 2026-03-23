import { describe, it, expect, vi, beforeEach } from "vitest";
import { transformToFramework } from "../../src/lib/template-engine.js";

describe("template-engine", () => {
  describe("transformToFramework", () => {
    const basicHtml = '<div class="container"><h1>Hello</h1><p>World</p></div>';
    const basicCss = "body { margin: 0; }";

    it("should return original HTML for vanilla framework", async () => {
      const result = await transformToFramework({
        framework: "vanilla",
        componentName: "Test",
        html: basicHtml,
      });

      expect(result).toBe(basicHtml);
    });

    it("should transform HTML to React component", async () => {
      const result = await transformToFramework({
        framework: "react",
        componentName: "TestComponent",
        html: basicHtml,
        css: basicCss,
      });

      expect(result).toContain("import React from 'react';");
      expect(result).toContain("export function TestComponent");
      expect(result).toContain('className=');
    });

    it("should transform HTML to Vue component", async () => {
      const result = await transformToFramework({
        framework: "vue",
        componentName: "TestComponent",
        html: basicHtml,
        css: basicCss,
      });

      expect(result).toContain("<template>");
      expect(result).toContain("<script setup lang=\"ts\">");
      expect(result).toContain("class=\"test-component\"");
    });

    it("should transform HTML to Svelte component", async () => {
      const result = await transformToFramework({
        framework: "svelte",
        componentName: "TestComponent",
        html: basicHtml,
        css: basicCss,
      });

      expect(result).toContain("<script setup lang=\"ts\">");
      expect(result).toContain("<style>");
      expect(result).toContain("class=\"testcomponent");
    });

    it("should transform HTML to Next.js component", async () => {
      const result = await transformToFramework({
        framework: "nextjs",
        componentName: "TestPage",
        html: basicHtml,
        css: basicCss,
      });

      expect(result).toContain("export default function TestPage");
      expect(result).toContain("className=");
    });

    it("should handle HTML without class attribute", async () => {
      const htmlNoClass = "<div><p>No class here</p></div>";
      
      const result = await transformToFramework({
        framework: "react",
        componentName: "NoClass",
        html: htmlNoClass,
      });

      expect(result).toContain("NoClass");
      expect(result).not.toContain("className=\"undefined\"");
    });

    it("should convert for attribute to htmlFor", async () => {
      const htmlWithFor = '<label for="email">Email</label><input id="email" />';
      
      const result = await transformToFramework({
        framework: "react",
        componentName: "FormField",
        html: htmlWithFor,
      });

      expect(result).toContain("htmlFor=");
      expect(result).not.toContain('for="email"');
    });
  });
});
