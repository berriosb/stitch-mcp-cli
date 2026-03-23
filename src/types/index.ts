export type DeviceType = "MOBILE" | "DESKTOP" | "TABLET" | "AGNOSTIC" | "DEVICE_TYPE_UNSPECIFIED";

export type ModelId = "GEMINI_3_PRO" | "GEMINI_3_FLASH" | "MODEL_ID_UNSPECIFIED";

export type ColorMode = "LIGHT" | "DARK" | "COLOR_MODE_UNSPECIFIED";

export type ScreenType = 
  | "SCREEN_TYPE_UNSPECIFIED"
  | "LOGIN"
  | "SIGNUP"
  | "DASHBOARD"
  | "PROFILE"
  | "SETTINGS"
  | "LIST"
  | "DETAIL"
  | "FORM"
  | "ONBOARDING"
  | "EMPTY_STATE"
  | "ERROR"
  | "MAINTENANCE"
  | "COMING_SOON";

export type CreativeRange = "REFINE" | "EXPLORE" | "REIMAGINE";

export type VariantAspect = "LAYOUT" | "COLOR_SCHEME" | "IMAGES" | "TEXT_FONT" | "TEXT_CONTENT";

export type Roundness = "ROUND_FOUR" | "ROUND_EIGHT" | "ROUND_TWELVE" | "ROUND_FULL";

export const FONT_FAMILIES = [
  "INTER",
  "ROBOTO",
  "DM_SANS",
  "GEIST",
  "SORA",
  "MANROPE",
  "LEXEND",
  "EPILOGUE",
  "BE_VIETNAM_PRO",
  "PLUS_JAKARTA_SANS",
  "PUBLIC_SANS",
  "SPACE_GROTESK",
  "SPLINE_SANS",
  "WORK_SANS",
  "MONTSERRAT",
  "METROPOLIS",
  "SOURCE_SANS_THREE",
  "NUNITO_SANS",
  "ARIMO",
  "HANKEN_GROTESK",
  "RUBIK",
  "IBM_PLEX_SANS",
  "NEWSREADER",
  "NOTO_SERIF",
  "DOMINE",
  "LIBRE_CASLON_TEXT",
  "EB_GARAMOND",
  "LITERATA",
  "SOURCE_SERIF_FOUR",
] as const;

export type FontFamily = typeof FONT_FAMILIES[number];

export interface DesignTheme {
  colorMode?: ColorMode;
  font?: FontFamily;
  roundness?: Roundness;
}

export interface CachedScreen {
  id: string;
  screenId: string;
  title?: string;
  html: string;
  css?: string;
  imageUrl?: string;
  lastSync: string;
}

export interface CachedProject {
  id: string;
  projectId: string;
  name: string;
  screens: CachedScreen[];
  lastSync: string;
}

export interface Framework {
  name: string;
  ext: string;
  componentType: "tsx" | "vue" | "svelte" | "jsx" | "html" | "ts";
}

export const FRAMEWORKS: Record<string, Framework> = {
  react: { name: "React", ext: "tsx", componentType: "tsx" },
  nextjs: { name: "Next.js", ext: "tsx", componentType: "tsx" },
  vue: { name: "Vue", ext: "vue", componentType: "vue" },
  svelte: { name: "Svelte", ext: "svelte", componentType: "svelte" },
  vanilla: { name: "Vanilla HTML", ext: "html", componentType: "html" },
} as const;

export interface Editor {
  name: string;
  cmd: string;
  configPath: string;
  format: "json" | "toml";
}

export const EDITORS: Editor[] = [
  { name: "Cursor", cmd: "cursor", configPath: ".cursor/mcp.json", format: "json" },
  { name: "Claude Code", cmd: "claude", configPath: ".claude/claude_desktop_config.json", format: "json" },
  { name: "VS Code", cmd: "code", configPath: ".config/Code/User/global.json", format: "json" },
  { name: "OpenCode", cmd: "opencode", configPath: ".config/opencode/opencode.json", format: "json" },
  { name: "Kilo Code", cmd: "kilo", configPath: ".config/opencode/opencode.json", format: "json" },
  { name: "Antigravity", cmd: "antigravity", configPath: ".antigravity/mcp_config.json", format: "json" },
  { name: "Codex CLI", cmd: "codex", configPath: ".codex/config.toml", format: "toml" },
];

export interface EvalResult {
  question: string;
  expectedAnswer: string;
  actualAnswer?: string;
  passed?: boolean;
  toolUsed?: string;
}

export interface EvalStats {
  total: number;
  passed: number;
  failed: number;
  results: EvalResult[];
}
