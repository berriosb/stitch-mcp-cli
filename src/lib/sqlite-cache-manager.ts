import Database from "better-sqlite3";
import path from "path";
import os from "os";
import type { CachedProject, CachedScreen } from "../types/index.js";

export class SqliteCacheManager {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const cacheDir = path.join(os.homedir(), ".stitch-mcp-cli");
    const dbFile = dbPath || path.join(cacheDir, "cache.db");
    
    if (!require("fs").existsSync(cacheDir)) {
      require("fs").mkdirSync(cacheDir, { recursive: true });
    }

    this.db = new Database(dbFile);
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        last_sync TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS screens (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        screen_id TEXT NOT NULL,
        title TEXT,
        html TEXT,
        css TEXT,
        image_url TEXT,
        last_sync TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );

      CREATE INDEX IF NOT EXISTS idx_screens_project ON screens(project_id);
    `);
  }

  async getProject(projectId: string): Promise<CachedProject | null> {
    const project = this.db.prepare(
      "SELECT * FROM projects WHERE id = ?"
    ).get(projectId) as { id: string; project_id: string; name: string; last_sync: string } | undefined;

    if (!project) return null;

    const screens = this.db.prepare(
      "SELECT * FROM screens WHERE project_id = ?"
    ).all(projectId) as Array<{
      id: string;
      screen_id: string;
      title: string | null;
      html: string;
      css: string | null;
      image_url: string | null;
      last_sync: string;
    }>;

    return {
      id: project.id,
      projectId: project.project_id,
      name: project.name,
      lastSync: project.last_sync,
      screens: screens.map((s) => ({
        id: s.id,
        screenId: s.screen_id,
        title: s.title || undefined,
        html: s.html,
        css: s.css || undefined,
        imageUrl: s.image_url || undefined,
        lastSync: s.last_sync,
      })),
    };
  }

  async saveProject(project: CachedProject): Promise<void> {
    const insertProject = this.db.prepare(`
      INSERT OR REPLACE INTO projects (id, project_id, name, last_sync)
      VALUES (?, ?, ?, ?)
    `);

    const insertScreen = this.db.prepare(`
      INSERT OR REPLACE INTO screens 
      (id, project_id, screen_id, title, html, css, image_url, last_sync)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      insertProject.run(project.id, project.projectId, project.name, project.lastSync);

      this.db.prepare("DELETE FROM screens WHERE project_id = ?").run(project.id);

      for (const screen of project.screens) {
        insertScreen.run(
          screen.id,
          project.id,
          screen.screenId,
          screen.title || null,
          screen.html,
          screen.css || null,
          screen.imageUrl || null,
          screen.lastSync
        );
      }
    });

    transaction();
  }

  async deleteProject(projectId: string): Promise<void> {
    this.db.prepare("DELETE FROM screens WHERE project_id = ?").run(projectId);
    this.db.prepare("DELETE FROM projects WHERE id = ?").run(projectId);
  }

  async listProjects(): Promise<CachedProject[]> {
    const projects = this.db.prepare("SELECT * FROM projects").all() as Array<{
      id: string;
      project_id: string;
      name: string;
      last_sync: string;
    }>;

    const result: CachedProject[] = [];
    for (const p of projects) {
      const cached = await this.getProject(p.id);
      if (cached) result.push(cached);
    }
    return result;
  }

  async clearCache(): Promise<void> {
    this.db.exec("DELETE FROM screens; DELETE FROM projects;");
  }

  getCacheDir(): string {
    return path.dirname(this.db.name);
  }

  getCacheSize(): { projectCount: number; screenCount: number; sizeBytes: number } {
    const projectCount = (this.db.prepare("SELECT COUNT(*) as count FROM projects").get() as { count: number }).count;
    const screenCount = (this.db.prepare("SELECT COUNT(*) as count FROM screens").get() as { count: number }).count;
    
    let sizeBytes = 0;
    try {
      const stats = require("fs").statSync(this.db.name);
      sizeBytes = stats.size;
    } catch {}

    return { projectCount, screenCount, sizeBytes };
  }

  close(): void {
    this.db.close();
  }
}

export const sqliteCache = new SqliteCacheManager();
