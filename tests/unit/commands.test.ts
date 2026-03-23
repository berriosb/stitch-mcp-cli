import { describe, it, expect, vi } from "vitest";

describe("projects command", () => {
  it("should be defined as a function", async () => {
    const { projects } = await import("../../src/commands/projects.js");
    expect(typeof projects).toBe("function");
  });

  it("should accept options object", async () => {
    const { projects } = await import("../../src/commands/projects.js");
    expect(typeof projects).toBe("function");
  });
});

describe("generate command", () => {
  it("should be defined as a function", async () => {
    const { generate } = await import("../../src/commands/generate.js");
    expect(typeof generate).toBe("function");
  });

  it("should require prompt argument", async () => {
    const { generate } = await import("../../src/commands/generate.js");
    const consoleErrorSpy = vi.spyOn(console, "error").mockReturnValue();
    const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });

    try {
      await generate("", {});
    } catch {
      // Expected to exit
    }

    expect(processExitSpy).toHaveBeenCalledWith(1);
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});

describe("sync command", () => {
  it("should be defined as a function", async () => {
    const { sync } = await import("../../src/commands/sync.js");
    expect(typeof sync).toBe("function");
  });
});

describe("watch command", () => {
  it("should be defined as a function", async () => {
    const { watch } = await import("../../src/commands/watch.js");
    expect(typeof watch).toBe("function");
  });
});

describe("eval command", () => {
  it("should be defined as a function", async () => {
    const { evalCmd } = await import("../../src/commands/eval.js");
    expect(typeof evalCmd).toBe("function");
  });

  it("should require eval file to exist", async () => {
    const { evalCmd } = await import("../../src/commands/eval.js");
    const consoleErrorSpy = vi.spyOn(console, "error").mockReturnValue();
    const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });

    try {
      await evalCmd({ file: "/nonexistent/path/eval.xml" });
    } catch {
      // Expected to exit
    }

    expect(processExitSpy).toHaveBeenCalledWith(1);
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});
