import { describe, it, expect, vi, beforeEach } from "vitest";
import { getStitchClient } from "../../src/lib/stitch-client.js";

vi.mock("@google/stitch-sdk", () => ({
  stitch: {
    projects: vi.fn(),
    project: vi.fn(),
  },
  StitchToolClient: vi.fn().mockImplementation(() => ({
    listTools: vi.fn(),
    callTool: vi.fn(),
    close: vi.fn(),
  })),
}));

vi.mock("../../src/lib/config.js", () => ({
  loadConfig: vi.fn().mockReturnValue({ apiKey: "test-api-key" }),
}));

describe("stitch-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStitchClient", () => {
    it("should return stitch client with api key from config", () => {
      const client = getStitchClient();
      
      expect(client).toBeDefined();
      expect(client.stitch).toBeDefined();
      expect(client.client).toBeDefined();
    });

    it("should throw error when no api key configured", async () => {
      vi.resetModules();
      
      vi.doMock("../../src/lib/config.js", () => ({
        loadConfig: vi.fn().mockReturnValue({}),
      }));
      
      const { getStitchClient: freshGetClient } = await import("../../src/lib/stitch-client.js");
      
      expect(() => freshGetClient()).toThrow("API key no configurada");
    });
  });
});
