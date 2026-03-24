import { z } from "zod";

export const DeviceTypeSchema = z.enum(["mobile", "desktop", "tablet"]);

export const FrameworkSchema = z.enum(["react", "vue", "svelte", "nextjs", "vanilla"]);

export const GenerateOptionsSchema = z.object({
  projectId: z.string().optional(),
  device: DeviceTypeSchema.optional().default("mobile"),
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

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
    throw new Error(`Validación fallida: ${errors}`);
  }
  return result.data;
}
