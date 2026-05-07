"use client";

import { createBrowserClient } from "@supabase/ssr";

import { assertEnv, env } from "@/lib/env";

export function createClient() {
  return createBrowserClient(
    assertEnv("NEXT_PUBLIC_SUPABASE_URL", env.supabaseUrl),
    assertEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)",
      env.supabaseAnonKey,
    ),
  );
}
