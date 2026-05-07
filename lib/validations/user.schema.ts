import { z } from "zod";

export const inviteUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.email(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  bio: z.string().max(600).optional(),
  avatarUrl: z.url().optional().or(z.literal("")),
});
