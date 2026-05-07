import { z } from "zod";

export const templateVariableSchema = z.object({
  name: z.string().min(1).max(80),
  label: z.string().min(1).max(120),
  type: z.enum(["text", "textarea", "select", "number"]).default("text"),
  defaultValue: z.string().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(true),
  placeholder: z.string().optional(),
});

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

export const templateSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(500).optional().default(""),
  content: z.string().min(10),
  type: z.enum(promptTypes).default("custom"),
  visibility: z.enum(["private", "public"]).default("private"),
  tags: z.array(z.string().min(1)).max(20).default([]),
  variables: z.array(templateVariableSchema).default([]),
});

export type TemplateInput = z.infer<typeof templateSchema>;
