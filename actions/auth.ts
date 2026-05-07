"use server";

import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/actions/types";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, resetPasswordSchema } from "@/lib/validations/auth.schema";
import { updateProfileSchema } from "@/lib/validations/user.schema";

export async function loginWithEmail(formData: FormData): Promise<ActionResult> {
  try {
    const parsed = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed);
    if (error) throw new Error(error.message);

    revalidatePath("/prompts");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function logout(): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    revalidatePath("/");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function sendPasswordReset(formData: FormData): Promise<ActionResult> {
  try {
    const email = String(formData.get("email") ?? "");
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.appUrl}/auth/confirm`,
    });
    if (error) throw new Error(error.message);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function updatePassword(formData: FormData): Promise<ActionResult> {
  try {
    const parsed = resetPasswordSchema.parse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.password });
    if (error) throw new Error(error.message);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const parsed = updateProfileSchema.parse({
      name: formData.get("name") || undefined,
      bio: formData.get("bio") || undefined,
      avatarUrl: formData.get("avatarUrl") || undefined,
    });

    const { error } = await supabase
      .from("profiles")
      .update({
        name: parsed.name,
        bio: parsed.bio,
        avatar_url: parsed.avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) throw new Error(error.message);
    revalidatePath("/settings/profile");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
