import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadConfig, saveConfig } from "../../src/lib/config.js";
import fs from "fs";
import path from "path";
import os from "os";

vi.mock("fs");

describe("config module", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loadConfig", () => {
    it("should return empty config when file does not exist", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      const result = loadConfig();
      
      expect(result).toEqual({});
    });

    it("should return parsed config when file exists", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ apiKey: "test-key" }));
      
      const result = loadConfig();
      
      expect(result).toEqual({ apiKey: "test-key" });
    });

    it("should return empty config on parse error", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue("invalid json");
      
      const result = loadConfig();
      
      expect(result).toEqual({});
    });
  });

  describe("saveConfig", () => {
    it("should create directory if not exists", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.mkdirSync).mockReturnValue();
      vi.mocked(fs.writeFileSync).mockReturnValue();
      
      saveConfig({ apiKey: "test-key" });
      
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it("should write config to file", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockReturnValue();
      
      saveConfig({ apiKey: "test-key" });
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify({ apiKey: "test-key" }, null, 2)
      );
    });
  });
});
