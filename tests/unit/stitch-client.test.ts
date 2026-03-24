import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@google/stitch-sdk", () => ({
  Stitch: vi.fn().mockImplementation((client) => ({
    projects: vi.fn(),
    project: vi.fn(),
    client,
  })),
  StitchToolClient: vi.fn().mockImplementation(() => ({
    listTools: vi.fn(),
    callTool: vi.fn(),
    close: vi.fn(),
  })),
}));

describe("stitch-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStitchClient", () => {
    it("should return stitch client with api key from config", async () => {
      vi.resetModules();
      vi.doMock("../../src/lib/secure-config.js", () => ({
        loadSecureConfig: vi.fn().mockReturnValue({ apiKey: "test-api-key" }),
      }));
      vi.doMock("@google/stitch-sdk", () => ({
        Stitch: vi.fn().mockImplementation((client) => ({
          projects: vi.fn(),
          project: vi.fn(),
          client,
        })),
        StitchToolClient: vi.fn().mockImplementation(() => ({
          listTools: vi.fn(),
          callTool: vi.fn(),
          close: vi.fn(),
        })),
      }));
      const { getStitchClient } = await import("../../src/lib/stitch-client.js");
      const client = getStitchClient();
      
      expect(client).toBeDefined();
      expect(client.stitch).toBeDefined();
      expect(client.client).toBeDefined();
    });

    it("should throw error when no api key configured", async () => {
      vi.resetModules();
      delete process.env.STITCH_API_KEY;
      vi.doMock("../../src/lib/secure-config.js", () => ({
        loadSecureConfig: vi.fn().mockReturnValue({}),
      }));
      vi.doMock("@google/stitch-sdk", () => ({
        Stitch: vi.fn().mockImplementation((client) => ({
          projects: vi.fn(),
          project: vi.fn(),
          client,
        })),
        StitchToolClient: vi.fn().mockImplementation(() => ({
          listTools: vi.fn(),
          callTool: vi.fn(),
          close: vi.fn(),
        })),
      }));
      const { getStitchClient: freshGetClient } = await import("../../src/lib/stitch-client.js");
      
      expect(() => freshGetClient()).toThrow("API key no configurada");
    });
  });
});
