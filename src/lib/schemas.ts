import { z } from "zod";

export const DeviceTypeSchema = z.enum(["mobile", "desktop", "tablet"]);

export const FrameworkSchema = z.enum(["react", "vue", "svelte", "nextjs", "nuxt", "solid", "angular", "vanilla"]);

export const ModelIdSchema = z.enum(["GEMINI_3_PRO", "GEMINI_3_FLASH", "GEMINI_3_1_PRO"]);

export const GenerateOptionsSchema = z.object({
  projectId: z.string().optional(),
  device: DeviceTypeSchema.optional().default("mobile"),
  modelId: ModelIdSchema.optional(),
  name: z.string().optional(),
});

export const ProjectsOptionsSchema = z.object({
  json: z.boolean().optional().default(false),
  search: z.string().optional(),
  offline: z.boolean().optional().default(false),
});

export const SyncOptionsSchema = z.object({
  output: z.string().optional().default("./stitch-output"),
});

export const ExportOptionsSchema = z.object({
  framework: FrameworkSchema.optional().default("react"),
  output: z.string().optional().default("./stitch-export"),
  routes: z.string().optional(),
});

export const CacheOptionsSchema = z.object({
  sync: z.string().optional(),
});

export const CreateProjectOptionsSchema = z.object({
  title: z.string().optional(),
});

export const UploadOptionsSchema = z.object({
  projectId: z.string(),
  file: z.string(),
  title: z.string().optional(),
  createScreenInstances: z.boolean().optional().default(true),
});

export const ColorModeSchema = z.enum(["LIGHT", "DARK", "COLOR_MODE_UNSPECIFIED"]);

export const ColorVariantSchema = z.enum([
  "MONOCHROME", "NEUTRAL", "TONAL_SPOT", "VIBRANT",
  "EXPRESSIVE", "FIDELITY", "CONTENT", "RAINBOW", "FRUIT_SALAD",
]);

export const RoundnessSchema = z.enum(["ROUND_TWO", "ROUND_FOUR", "ROUND_EIGHT", "ROUND_TWELVE", "ROUND_FULL"]);

export const FontFamilySchema = z.enum([
  "INTER", "BE_VIETNAM_PRO", "EPILOGUE", "LEXEND", "MANROPE",
  "NEWSREADER", "NOTO_SERIF", "PLUS_JAKARTA_SANS", "PUBLIC_SANS",
  "SPACE_GROTESK", "SPLINE_SANS", "WORK_SANS", "DM_SANS", "GEIST",
  "SORA", "DOMINE", "LIBRE_CASLON_TEXT", "EB_GARAMOND", "LITERATA",
  "SOURCE_SERIF_FOUR", "MONTSERRAT", "METROPOLIS", "SOURCE_SANS_THREE",
  "NUNITO_SANS", "ARIMO", "HANKEN_GROTESK", "RUBIK", "IBM_PLEX_SANS",
]);

export const DesignSystemInputSchema = z.object({
  displayName: z.string().optional(),
  designTokens: z.string().optional(),
  styleGuidelines: z.string().optional(),
  theme: z.object({
    colorMode: ColorModeSchema.optional(),
    font: FontFamilySchema.optional(),
    headlineFont: FontFamilySchema.optional(),
    bodyFont: FontFamilySchema.optional(),
    labelFont: FontFamilySchema.optional(),
    roundness: RoundnessSchema.optional(),
    customColor: z.string().optional(),
    saturation: z.number().min(0).max(2).optional(),
    colorVariant: ColorVariantSchema.optional(),
    overridePrimaryColor: z.string().optional(),
    overrideSecondaryColor: z.string().optional(),
    overrideTertiaryColor: z.string().optional(),
    overrideNeutralColor: z.string().optional(),
    backgroundLight: z.string().optional(),
    backgroundDark: z.string().optional(),
    spacingScale: z.number().optional(),
    designMd: z.string().optional(),
    description: z.string().optional(),
    preset: z.string().optional(),
  }).optional(),
});

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
    throw new Error(`Validación fallida: ${errors}`);
  }
  return result.data;
}
