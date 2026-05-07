import { createClient } from "@supabase/supabase-js";

import { assertEnv, env } from "@/lib/env";

export function createAdminClient() {
  return createClient(
    assertEnv("NEXT_PUBLIC_SUPABASE_URL", env.supabaseUrl),
    assertEnv("SUPABASE_SERVICE_ROLE_KEY", env.supabaseServiceRoleKey),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
