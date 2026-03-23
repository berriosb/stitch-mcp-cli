import fs from "fs";
import path from "path";
import os from "os";
import type { CachedProject, CachedScreen } from "../types/index.js";

export class CacheManager {
  private cacheDir: string;

  constructor(cacheDir?: string) {
    this.cacheDir = cacheDir || path.join(os.homedir(), ".stitch-mcp-cli", "cache");
  }

  async getProject(projectId: string): Promise<CachedProject | null> {
    const cacheFile = path.join(this.cacheDir, `${this.sanitizeFileName(projectId)}.json`);
    if (!fs.existsSync(cacheFile)) {
      return null;
    }
    try {
      return JSON.parse(fs.readFileSync(cacheFile, "utf-8")) as CachedProject;
    } catch {
      return null;
    }
  }

  async saveProject(project: CachedProject): Promise<void> {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    const cacheFile = path.join(this.cacheDir, `${this.sanitizeFileName(project.id)}.json`);
    fs.writeFileSync(cacheFile, JSON.stringify(project, null, 2));
  }

  async deleteProject(projectId: string): Promise<void> {
    const cacheFile = path.join(this.cacheDir, `${this.sanitizeFileName(projectId)}.json`);
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile);
    }
  }

  async listProjects(): Promise<CachedProject[]> {
    if (!fs.existsSync(this.cacheDir)) {
      return [];
    }
    const files = fs.readdirSync(this.cacheDir).filter((f) => f.endsWith(".json"));
    const projects: CachedProject[] = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.cacheDir, file), "utf-8");
        projects.push(JSON.parse(content) as CachedProject);
      } catch {
        // Skip invalid files
      }
    }
    return projects;
  }

  async clearCache(): Promise<void> {
    if (fs.existsSync(this.cacheDir)) {
      fs.rmSync(this.cacheDir, { recursive: true });
    }
  }

  getCacheDir(): string {
    return this.cacheDir;
  }

  getCacheSize(): { projectCount: number; screenCount: number; sizeBytes: number } {
    if (!fs.existsSync(this.cacheDir)) {
      return { projectCount: 0, screenCount: 0, sizeBytes: 0 };
    }

    const files = fs.readdirSync(this.cacheDir).filter((f) => f.endsWith(".json"));
    let totalSize = 0;
    let screenCount = 0;

    for (const file of files) {
      const filePath = path.join(this.cacheDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;

      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const project = JSON.parse(content) as CachedProject;
        screenCount += project.screens?.length || 0;
      } catch {
        // Skip invalid files
      }
    }

    return {
      projectCount: files.length,
      screenCount,
      sizeBytes: totalSize,
    };
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
  }
}

export const cacheManager = new CacheManager();
