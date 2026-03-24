import type { CachedProject } from "../types/index.js";
import { CacheManager } from "./cache-manager.js";

export interface CacheBackend {
  getProject(projectId: string): Promise<CachedProject | null>;
  saveProject(project: CachedProject): Promise<void>;
  deleteProject(projectId: string): Promise<void>;
  listProjects(): Promise<CachedProject[]>;
  clearCache(): Promise<void>;
  getCacheDir(): string;
  getCacheSize(): { projectCount: number; screenCount: number; sizeBytes: number };
  close?(): void;
}

let cacheBackend: CacheBackend | null = null;

export async function getCache(): Promise<CacheBackend> {
  if (cacheBackend) return cacheBackend;

  try {
    await import("better-sqlite3");
    const { SqliteCacheManager } = await import("./sqlite-cache-manager.js");
    cacheBackend = new SqliteCacheManager();
    return cacheBackend;
  } catch {
    cacheBackend = new CacheManager();
    return cacheBackend;
  }
}