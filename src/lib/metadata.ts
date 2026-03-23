import fs from "fs";
import path from "path";
import os from "os";

export interface ScreenMetadata {
  id: string;
  sourceScreen: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DesignTheme {
  colorMode: string;
  font: string;
  roundness: string;
  customColor: string;
  saturation: number;
}

export interface StitchMetadata {
  name?: string;
  projectId: string;
  title: string;
  visibility?: string;
  createTime?: string;
  updateTime?: string;
  projectType?: string;
  origin?: string;
  deviceType: string;
  designTheme?: DesignTheme;
  screens: Record<string, ScreenMetadata>;
  metadata?: {
    userRole?: string;
  };
}

const METADATA_DIR = ".stitch";
const METADATA_FILE = "metadata.json";

function getMetadataPath(): string {
  const cwd = process.cwd();
  return path.join(cwd, METADATA_DIR, METADATA_FILE);
}

export function getMetadataDir(): string {
  return path.join(process.cwd(), METADATA_DIR);
}

export function metadataExists(): boolean {
  const filePath = getMetadataPath();
  return fs.existsSync(filePath);
}

export function readMetadata(): StitchMetadata | null {
  const filePath = getMetadataPath();
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as StitchMetadata;
  } catch (error) {
    console.error("Error reading metadata:", error instanceof Error ? error.message : error);
    return null;
  }
}

export function writeMetadata(metadata: StitchMetadata): void {
  const dir = getMetadataDir();
  const filePath = getMetadataPath();
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
}

export function initMetadata(projectId: string, projectData: Partial<StitchMetadata> = {}): StitchMetadata {
  const metadata: StitchMetadata = {
    projectId,
    title: projectData.title || "Untitled",
    deviceType: projectData.deviceType || "MOBILE",
    designTheme: projectData.designTheme,
    screens: projectData.screens || {},
    ...projectData,
  };
  
  writeMetadata(metadata);
  return metadata;
}

export function updateScreen(
  screenName: string,
  screenData: ScreenMetadata
): void {
  const metadata = readMetadata();
  
  if (!metadata) {
    throw new Error("No metadata file found. Run in a project directory first.");
  }
  
  metadata.screens[screenName] = screenData;
  metadata.updateTime = new Date().toISOString();
  
  writeMetadata(metadata);
}

export function updateDesignTheme(designTheme: DesignTheme): void {
  const metadata = readMetadata();
  
  if (!metadata) {
    throw new Error("No metadata file found. Run in a project directory first.");
  }
  
  metadata.designTheme = designTheme;
  metadata.updateTime = new Date().toISOString();
  
  writeMetadata(metadata);
}

export function getProjectId(): string | null {
  const metadata = readMetadata();
  return metadata?.projectId || null;
}

export function getDesignTheme(): DesignTheme | null {
  const metadata = readMetadata();
  return metadata?.designTheme || null;
}

export function getScreens(): Record<string, ScreenMetadata> {
  const metadata = readMetadata();
  return metadata?.screens || {};
}
