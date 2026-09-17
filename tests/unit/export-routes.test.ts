import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../src/lib/stitch-client.js", () => ({
  getStitchClient: vi.fn(),
}));

vi.mock("../../src/lib/resolve-html.js", () => ({
  resolveHtml: vi.fn(),
}));

import { getStitchClient } from "../../src/lib/stitch-client.js";
import { resolveHtml } from "../../src/lib/resolve-html.js";
import { exportCmd } from "../../src/commands/export.js";

function makeScreen(id: string, html: string) {
  return {
    screenId: id,
    getHtml: vi.fn().mockResolvedValue(html),
  };
}

describe("export --routes (Next.js)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps each route to a distinct screen via round-robin when no route=screenId is specified", async () => {
    const screens = [
      makeScreen("s1", "<div>HOME</div>"),
      makeScreen("s2", "<div>ABOUT</div>"),
      makeScreen("s3", "<div>PRICING</div>"),
    ];
    vi.mocked(getStitchClient).mockReturnValue({
      stitch: {
        project: () => ({
          screens: async () => screens,
        }),
      },
    } as any);
    vi.mocked(resolveHtml).mockImplementation(async (s: any) => s.getHtml());

    const tmpDir = `/tmp/stitch-export-test-${Date.now()}`;
    await exportCmd("proj-1", {
      framework: "nextjs",
      output: tmpDir,
      routes: "/, /about, /pricing",
    });

    const fs = await import("fs");
    const home = fs.readFileSync(`${tmpDir}/page.tsx`, "utf-8");
    const about = fs.readFileSync(`${tmpDir}/about/page.tsx`, "utf-8");
    const pricing = fs.readFileSync(`${tmpDir}/pricing/page.tsx`, "utf-8");

    expect(home).toContain("HOME");
    expect(about).toContain("ABOUT");
    expect(pricing).toContain("PRICING");

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("respects route=screenId mapping when provided", async () => {
    const screens = [
      makeScreen("s1", "<div>HOME</div>"),
      makeScreen("s2", "<div>ABOUT</div>"),
    ];
    vi.mocked(getStitchClient).mockReturnValue({
      stitch: {
        project: () => ({
          screens: async () => screens,
        }),
      },
    } as any);
    vi.mocked(resolveHtml).mockImplementation(async (s: any) => s.getHtml());

    const tmpDir = `/tmp/stitch-export-test-${Date.now()}-2`;
    await exportCmd("proj-1", {
      framework: "nextjs",
      output: tmpDir,
      routes: "/=s2, /about=s1",
    });

    const fs = await import("fs");
    const home = fs.readFileSync(`${tmpDir}/page.tsx`, "utf-8");
    const about = fs.readFileSync(`${tmpDir}/about/page.tsx`, "utf-8");

    expect(home).toContain("ABOUT");
    expect(about).toContain("HOME");

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("falls back to round-robin when specified screenId does not exist", async () => {
    const screens = [
      makeScreen("s1", "<div>HOME</div>"),
      makeScreen("s2", "<div>ABOUT</div>"),
    ];
    vi.mocked(getStitchClient).mockReturnValue({
      stitch: {
        project: () => ({
          screens: async () => screens,
        }),
      },
    } as any);
    vi.mocked(resolveHtml).mockImplementation(async (s: any) => s.getHtml());

    const tmpDir = `/tmp/stitch-export-test-${Date.now()}-3`;
    await exportCmd("proj-1", {
      framework: "nextjs",
      output: tmpDir,
      routes: "/=nonexistent, /about",
    });

    const fs = await import("fs");
    const home = fs.readFileSync(`${tmpDir}/page.tsx`, "utf-8");
    const about = fs.readFileSync(`${tmpDir}/about/page.tsx`, "utf-8");
    // round-robin: index 0 → s1 (HOME), index 1 → s2 (ABOUT)
    expect(home).toContain("HOME");
    expect(about).toContain("ABOUT");

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
