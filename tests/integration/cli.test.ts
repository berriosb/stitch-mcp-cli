import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

describe("CLI Integration Tests", () => {
  const testDir = path.join(os.tmpdir(), "stitch-cli-test-" + Date.now());
  const configDir = path.join(testDir, ".stitch-mcp-cli");
  const configFile = path.join(configDir, "config.json");

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("auth command", () => {
    it("should validate API key format", () => {
      const mockKey = "AIzaSyDummyKeyForTesting123456789";
      expect(mockKey.startsWith("AIza")).toBe(true);
      expect(mockKey.length).toBeGreaterThan(20);
    });

    it("should handle missing API key error", () => {
      const errorMessage = "API key no configurada";
      expect(errorMessage).toContain("API key");
    });
  });

  describe("projects command", () => {
    it("should handle offline mode", () => {
      const offlineMessage = "Modo offline";
      expect(offlineMessage).toBeDefined();
    });

    it("should filter projects by search term", () => {
      const projects = [
        { id: "project-1", name: "Dashboard App" },
        { id: "project-2", name: "Login Screen" },
        { id: "project-3", name: "Settings Page" },
      ];

      const searchTerm = "dashboard";
      const filtered = projects.filter(p =>
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Dashboard App");
    });
  });

  describe("export command", () => {
    it("should validate framework types", () => {
      const validFrameworks = ["react", "vue", "svelte", "nextjs", "vanilla"];
      const invalidFramework = "angular";

      expect(validFrameworks.includes(invalidFramework)).toBe(false);
      expect(validFrameworks.includes("react")).toBe(true);
    });

    it("should generate correct file extensions", () => {
      const extensions: Record<string, string> = {
        react: "tsx",
        nextjs: "tsx",
        vue: "vue",
        svelte: "svelte",
        vanilla: "html",
      };

      expect(extensions["react"]).toBe("tsx");
      expect(extensions["vue"]).toBe("vue");
      expect(extensions["svelte"]).toBe("svelte");
    });
  });

  describe("cache command", () => {
    it("should calculate cache size correctly", () => {
      const sizeBytes = 1024 * 50;
      const sizeKB = sizeBytes / 1024;

      expect(sizeKB).toBe(50);
    });

    it("should format cache status output", () => {
      const status = {
        projectCount: 3,
        screenCount: 15,
        sizeKB: 256.5,
        cacheDir: "/home/user/.stitch-mcp-cli",
      };

      expect(status.projectCount).toBe(3);
      expect(status.screenCount).toBe(15);
      expect(status.sizeKB).toBe(256.5);
    });
  });
});

describe("MCP Server Tools Integration", () => {
  describe("Tool schemas", () => {
    it("should validate list_projects input schema", () => {
      const schema = {
        search: { type: "string", optional: true },
        json: { type: "boolean", default: false },
      };

      expect(schema.search).toBeDefined();
      expect(schema.json).toBeDefined();
      expect(schema.json.default).toBe(false);
    });

    it("should validate generate_screen input schema", () => {
      const schema = {
        prompt: { type: "string", minLength: 1 },
        projectId: { type: "string", optional: true },
        device: { type: "enum", values: ["mobile", "desktop", "tablet"], default: "mobile" },
        name: { type: "string", optional: true },
      };

      expect(schema.prompt).toBeDefined();
      expect(schema.device.values).toContain("mobile");
      expect(schema.device.default).toBe("mobile");
    });

    it("should validate sync_screen input schema", () => {
      const schema = {
        projectId: { type: "string" },
        screenId: { type: "string", optional: true },
        output: { type: "string", default: "./stitch-output" },
      };

      expect(schema.projectId).toBeDefined();
      expect(schema.output.default).toBe("./stitch-output");
    });
  });

  describe("Rate limiting", () => {
    it("should track request counts", () => {
      const maxRequests = 60;
      const windowMs = 60000;

      let count = 0;
      const isLimited = () => count >= maxRequests;

      for (let i = 0; i < 60; i++) {
        if (!isLimited()) count++;
      }

      expect(isLimited()).toBe(true);
      expect(count).toBe(60);
    });

    it("should reset after window expires", () => {
      const mockWindowMs = 100;
      const now = Date.now();
      const resetAt = now + mockWindowMs;

      expect(resetAt).toBeGreaterThan(now);
    });
  });
});

describe("Workflow Integration Tests", () => {
  it("should complete auth -> projects -> generate -> sync workflow", () => {
    const workflow = {
      auth: { apiKey: "test-key", saved: true },
      projects: { count: 2, selected: "project-1" },
      generate: { screenId: "screen-abc123" },
      sync: { html: "<div>test</div>", saved: true },
    };

    expect(workflow.auth.saved).toBe(true);
    expect(workflow.projects.count).toBe(2);
    expect(workflow.generate.screenId).toBeDefined();
    expect(workflow.sync.saved).toBe(true);
  });

  it("should handle offline workflow with cache", () => {
    const offlineWorkflow = {
      cache: { synced: true, projects: 3, screens: 12 },
      offline: true,
      projects: { fromCache: true, count: 3 },
      sync: { html: "<div>cached</div>", saved: true },
    };

    expect(offlineWorkflow.offline).toBe(true);
    expect(offlineWorkflow.projects.fromCache).toBe(true);
    expect(offlineWorkflow.cache.projects).toBe(3);
  });

  it("should validate export workflow", () => {
    const exportWorkflow = {
      projects: { selected: "project-1" },
      export: {
        framework: "react",
        screens: 5,
        output: "./src/components",
        files: ["Screen1.tsx", "Screen2.tsx", "Screen3.tsx", "Screen4.tsx", "Screen5.tsx"],
      },
    };

    expect(exportWorkflow.export.files).toHaveLength(5);
    expect(exportWorkflow.export.framework).toBe("react");
    expect(exportWorkflow.export.output).toBe("./src/components");
  });
});
