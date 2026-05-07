import { z } from "zod";

const promptTypes = [
  "system",
  "user",
  "assistant",
  "few-shot",
  "chain-of-thought",
  "instruction",
  "persona",
  "template",
  "custom",
] as const;

export const promptSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(500).optional().default(""),
  content: z.string().min(10),
  type: z.enum(promptTypes).default("custom"),
  visibility: z.enum(["private", "public"]).default("private"),
  tags: z.array(z.string().min(1)).max(20).default([]),
  targetModels: z.array(z.string().min(1)).max(10).default([]),
  status: z.enum(["draft", "active", "archived"]).default("active"),
  rating: z.number().int().min(1).max(5).nullable().optional().default(null),
  notes: z.string().max(5000).optional().default(""),
});

export type PromptInput = z.infer<typeof promptSchema>;
