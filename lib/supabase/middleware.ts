import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { assertEnv, env } from "@/lib/env";

export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    assertEnv("NEXT_PUBLIC_SUPABASE_URL", env.supabaseUrl),
    assertEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", env.supabaseAnonKey),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  return { supabase, response };
}
