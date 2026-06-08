export type DeviceType = "MOBILE" | "DESKTOP" | "TABLET" | "AGNOSTIC" | "DEVICE_TYPE_UNSPECIFIED";

export type ModelId = "GEMINI_3_PRO" | "GEMINI_3_FLASH" | "GEMINI_3_1_PRO" | "MODEL_ID_UNSPECIFIED";

export type ColorMode = "LIGHT" | "DARK" | "COLOR_MODE_UNSPECIFIED";

export type ColorVariant =
  | "COLOR_VARIANT_UNSPECIFIED"
  | "MONOCHROME"
  | "NEUTRAL"
  | "TONAL_SPOT"
  | "VIBRANT"
  | "EXPRESSIVE"
  | "FIDELITY"
  | "CONTENT"
  | "RAINBOW"
  | "FRUIT_SALAD";

export type CreativeRange = "REFINE" | "EXPLORE" | "REIMAGINE" | "CREATIVE_RANGE_UNSPECIFIED";

export type VariantAspect = "LAYOUT" | "COLOR_SCHEME" | "IMAGES" | "TEXT_FONT" | "TEXT_CONTENT" | "VARIANT_ASPECT_UNSPECIFIED";

export type Roundness = "ROUND_TWO" | "ROUND_FOUR" | "ROUND_EIGHT" | "ROUND_TWELVE" | "ROUND_FULL" | "ROUNDNESS_UNSPECIFIED";

export const FONT_FAMILIES = [
  "FONT_UNSPECIFIED",
  "INTER",
  "BE_VIETNAM_PRO",
  "EPILOGUE",
  "LEXEND",
  "MANROPE",
  "NEWSREADER",
  "NOTO_SERIF",
  "PLUS_JAKARTA_SANS",
  "PUBLIC_SANS",
  "SPACE_GROTESK",
  "SPLINE_SANS",
  "WORK_SANS",
  "DM_SANS",
  "GEIST",
  "SORA",
  "DOMINE",
  "LIBRE_CASLON_TEXT",
  "EB_GARAMOND",
  "LITERATA",
  "SOURCE_SERIF_FOUR",
  "MONTSERRAT",
  "METROPOLIS",
  "SOURCE_SANS_THREE",
  "NUNITO_SANS",
  "ARIMO",
  "HANKEN_GROTESK",
  "RUBIK",
  "IBM_PLEX_SANS",
] as const;

export type FontFamily = typeof FONT_FAMILIES[number];

export interface DesignTheme {
  colorMode?: ColorMode;
  font?: FontFamily;
  headlineFont?: FontFamily;
  bodyFont?: FontFamily;
  labelFont?: FontFamily;
  roundness?: Roundness;
  customColor?: string;
  saturation?: number;
  colorVariant?: ColorVariant;
  overridePrimaryColor?: string;
  overrideSecondaryColor?: string;
  overrideTertiaryColor?: string;
  overrideNeutralColor?: string;
  backgroundLight?: string;
  backgroundDark?: string;
  namedColors?: Record<string, string>;
  spacingScale?: number;
  spacing?: Record<string, string>;
  designMd?: string;
  description?: string;
  preset?: string;
  typography?: Record<string, TypographyToken>;
}

export interface TypographyToken {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  letterSpacing?: string;
  lineHeight?: string;
}

export interface DesignSystemInput {
  displayName?: string;
  designTokens?: string;
  styleGuidelines?: string;
  theme?: DesignTheme;
}

export interface SelectedScreenInstance {
  id: string;
  sourceScreen: string;
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
