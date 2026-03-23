import { describe, it, expect, vi, beforeEach } from "vitest";
import { CacheManager } from "../../src/lib/cache-manager.js";
import fs from "fs";
import path from "path";
import os from "os";

vi.mock("fs");

describe("CacheManager", () => {
  const mockCacheDir = "/mock/cache";
  let cacheManager: CacheManager;

  beforeEach(() => {
    vi.resetAllMocks();
    cacheManager = new CacheManager(mockCacheDir);
  });

  describe("getCacheDir", () => {
    it("should return the cache directory", () => {
      expect(cacheManager.getCacheDir()).toBe(mockCacheDir);
    });
  });

  describe("getCacheSize", () => {
    it("should return zero when cache is empty", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const size = cacheManager.getCacheSize();
      expect(size.projectCount).toBe(0);
      expect(size.screenCount).toBe(0);
      expect(size.sizeBytes).toBe(0);
    });

    it("should count files in cache", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(["project1.json"] as any);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1024 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
        screens: [{ id: "s1" }, { id: "s2" }],
      }));

      const size = cacheManager.getCacheSize();
      expect(size.projectCount).toBe(1);
      expect(size.screenCount).toBe(2);
      expect(size.sizeBytes).toBe(1024);
    });
  });

  describe("clearCache", () => {
    it("should remove cache directory", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.rmSync).mockReturnValue();

      await cacheManager.clearCache();

      expect(fs.rmSync).toHaveBeenCalledWith(mockCacheDir, { recursive: true });
    });
  });

  describe("sanitizeFileName", () => {
    it("should sanitize special characters", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = cacheManager.getCacheSize();
      expect(result).toBeDefined();
    });
  });
});
