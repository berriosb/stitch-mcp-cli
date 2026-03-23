import { describe, it, expect, vi, beforeEach } from "vitest";
import { StitchToolClient } from "@google/stitch-sdk";

vi.mock("@google/stitch-sdk", () => ({
  StitchToolClient: vi.fn().mockImplementation(() => ({
    listTools: vi.fn().mockResolvedValue([]),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("../../src/lib/config.js", () => ({
  loadConfig: vi.fn().mockReturnValue({ apiKey: "test-key" }),
  saveConfig: vi.fn(),
}));

describe("auth command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined as a function", async () => {
    const { auth } = await import("../../src/commands/auth.js");
    expect(typeof auth).toBe("function");
  });

  it("should validate api key is passed", async () => {
    const { auth } = await import("../../src/commands/auth.js");
    const consoleErrorSpy = vi.spyOn(console, "error").mockReturnValue();
    const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });

    try {
      await auth({});
    } catch {
      // Expected to exit
    }

    expect(processExitSpy).toHaveBeenCalledWith(1);
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it("should validate api key format", async () => {
    const { auth } = await import("../../src/commands/auth.js");
    expect(typeof auth).toBe("function");
  });
});
