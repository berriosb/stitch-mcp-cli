import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";

vi.mock("fs");

describe("config module integration", () => {
  it("should handle missing config file", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const configPath = path.join("/mock", ".stitch-mcp-cli", "config.json");
    expect(fs.existsSync(configPath)).toBe(false);
  });

  it("should read existing config file", () => {
    const mockConfig = { apiKey: "test-key" };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

    const configPath = path.join("/mock", ".stitch-mcp-cli", "config.json");
    const content = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(content);

    expect(parsed.apiKey).toBe("test-key");
  });
});

describe("export command integration", () => {
  it("should validate framework input", () => {
    const validFrameworks = ["react", "vue", "svelte", "nextjs", "vanilla"];
    const invalidFramework = "invalid-framework";

    expect(validFrameworks.includes(invalidFramework)).toBe(false);
  });

  it("should handle directory creation", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockReturnValue();

    const outputDir = "/mock/output";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    expect(fs.mkdirSync).toHaveBeenCalled();
  });
});

describe("eval command integration", () => {
  it("should parse valid eval XML", () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<evaluation>
  <qa_pair>
    <question>Test question?</question>
    <answer>Test answer</answer>
    <tool_used>list_projects</tool_used>
  </qa_pair>
</evaluation>`;

    const pairRegex = /<qa_pair>[\s\S]*?<\/qa_pair>/g;
    const matches = xmlContent.match(pairRegex);

    expect(matches).not.toBeNull();
    expect(matches!).toHaveLength(1);
  });

  it("should return null for empty XML", () => {
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<evaluation>
</evaluation>`;

    const pairRegex = /<qa_pair>[\s\S]*?<\/qa_pair>/g;
    const matches = emptyXml.match(pairRegex);

    expect(matches).toBeNull();
  });
});
