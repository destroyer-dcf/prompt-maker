import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { assertEnv, env } from "@/lib/env";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password", "/auth/confirm", "/p/"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    assertEnv("NEXT_PUBLIC_SUPABASE_URL", env.supabaseUrl),
    assertEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)",
      env.supabaseAnonKey,
    ),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/prompts", request.url));
  }

  if (user && pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin" || profile?.status === "disabled") {
      return NextResponse.redirect(new URL("/prompts", request.url));
    }
  }

  if (user && (pathname.startsWith("/prompts") || pathname.startsWith("/settings"))) {
    const { data: profile } = await supabase.from("profiles").select("status").eq("id", user.id).single();

    if (profile?.status === "disabled") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
