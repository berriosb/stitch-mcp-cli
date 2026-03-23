import { describe, it, expect } from "vitest";
import {
  getFramework,
  getExtension,
  getComponentType,
  isValidFramework,
  getSupportedFrameworks,
} from "../../src/lib/framework-mapper.js";

describe("framework-mapper", () => {
  describe("getFramework", () => {
    it("should return framework for valid name", () => {
      const react = getFramework("react");
      expect(react).toEqual({ name: "React", ext: "tsx", componentType: "tsx" });
    });

    it("should return null for invalid name", () => {
      const invalid = getFramework("unknown");
      expect(invalid).toBeNull();
    });

    it("should be case insensitive", () => {
      const reactUpper = getFramework("REACT");
      const reactLower = getFramework("react");

      expect(reactUpper).toEqual(reactLower);
    });
  });

  describe("getExtension", () => {
    it("should return tsx for react", () => {
      expect(getExtension("react")).toBe("tsx");
    });

    it("should return vue for vue", () => {
      expect(getExtension("vue")).toBe("vue");
    });

    it("should return svelte for svelte", () => {
      expect(getExtension("svelte")).toBe("svelte");
    });

    it("should return html for vanilla", () => {
      expect(getExtension("vanilla")).toBe("html");
    });

    it("should return html for unknown", () => {
      expect(getExtension("unknown")).toBe("html");
    });
  });

  describe("getComponentType", () => {
    it("should return correct component types", () => {
      expect(getComponentType("react")).toBe("tsx");
      expect(getComponentType("vue")).toBe("vue");
      expect(getComponentType("svelte")).toBe("svelte");
      expect(getComponentType("vanilla")).toBe("html");
    });
  });

  describe("isValidFramework", () => {
    it("should return true for valid frameworks", () => {
      expect(isValidFramework("react")).toBe(true);
      expect(isValidFramework("vue")).toBe(true);
      expect(isValidFramework("svelte")).toBe(true);
      expect(isValidFramework("nextjs")).toBe(true);
      expect(isValidFramework("nuxt")).toBe(true);
      expect(isValidFramework("solid")).toBe(true);
      expect(isValidFramework("angular")).toBe(true);
      expect(isValidFramework("vanilla")).toBe(true);
    });

    it("should return false for invalid frameworks", () => {
      expect(isValidFramework("unknown")).toBe(false);
      expect(isValidFramework("preact")).toBe(false);
      expect(isValidFramework("qwik")).toBe(false);
    });
  });

  describe("getSupportedFrameworks", () => {
    it("should return all supported frameworks", () => {
      const frameworks = getSupportedFrameworks();
      expect(frameworks).toContain("react");
      expect(frameworks).toContain("vue");
      expect(frameworks).toContain("svelte");
      expect(frameworks).toContain("nextjs");
      expect(frameworks).toContain("nuxt");
      expect(frameworks).toContain("solid");
      expect(frameworks).toContain("angular");
      expect(frameworks).toContain("vanilla");
      expect(frameworks).toHaveLength(8);
    });
  });
});
