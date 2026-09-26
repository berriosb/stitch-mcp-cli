import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Screen } from "@google/stitch-sdk";

describe("resolveHtml", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    const { logger } = await import("../../src/lib/logger.js");
    warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  function makeScreen(html: string): Screen {
    return {
      screenId: "screen-123",
      getHtml: vi.fn().mockResolvedValue(html),
    } as unknown as Screen;
  }

  it("returns inline HTML when getHtml returns inline content", async () => {
    const { resolveHtml } = await import("../../src/lib/resolve-html.js");
    const screen = makeScreen("<div>hello</div>");
    const result = await resolveHtml(screen);
    expect(result).toBe("<div>hello</div>");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns placeholder and logs warn when getHtml returns empty", async () => {
    const { resolveHtml } = await import("../../src/lib/resolve-html.js");
    const screen = makeScreen("");
    const result = await resolveHtml(screen);
    expect(result).toBe("<div></div>");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ screenId: "screen-123" }),
      expect.stringContaining("empty HTML")
    );
  });

  it("returns placeholder and logs warn when fetch fails", async () => {
    const { resolveHtml } = await import("../../src/lib/resolve-html.js");
    const screen = makeScreen("http://127.0.0.1:1/not-reachable");
    const result = await resolveHtml(screen);
    expect(result).toBe("<div></div>");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ screenId: "screen-123", url: expect.stringContaining("127.0.0.1") }),
      expect.stringContaining("fetch failed")
    );
  });

  it("returns placeholder and logs warn when fetch returns non-OK status", async () => {
    const { resolveHtml } = await import("../../src/lib/resolve-html.js");
    // Spin up a tiny HTTP server that returns 404
    const http = await import("http");
    const server = http.createServer((_req, res) => {
      res.statusCode = 404;
      res.end("nope");
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;

    try {
      const screen = makeScreen(`http://127.0.0.1:${port}/x`);
      const { resolveHtml } = await import("../../src/lib/resolve-html.js");
      const result = await resolveHtml(screen);
      expect(result).toBe("<div></div>");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: 404 }),
        expect.stringContaining("non-OK status")
      );
    } finally {
      server.close();
    }
  });
});
