import { z } from "zod";

export const collectionSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional().default(""),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .default("#1d4ed8"),
  icon: z.string().min(1).max(40).optional().default("folder"),
});

export type CollectionInput = z.infer<typeof collectionSchema>;
