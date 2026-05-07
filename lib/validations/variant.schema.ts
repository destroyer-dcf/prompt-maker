import { z } from "zod";

export const variantSchema = z.object({
  label: z.string().min(2).max(120),
  content: z.string().min(10).max(20000),
  notes: z.string().max(5000).optional().default(""),
});

export const variantRatingSchema = z
  .number()
  .int()
  .min(1)
  .max(5)
  .nullable();

export type VariantInput = z.infer<typeof variantSchema>;
