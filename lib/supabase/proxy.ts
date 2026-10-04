import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";
import { getSupabaseEnv } from "./env";

// Pages that need a signed-in user. Onboarding status is checked in the layouts.
const PROTECTED_PREFIXES = [
  "/home",
  "/discover",
  "/find",
  "/projects",
  "/posts",
  "/tag",
  "/messages",
  "/notifications",
  "/profile",
  "/u",
  "/settings",
  "/support",
  "/onboarding",
];
// Signed-in users skip these. /reset-password is NOT here: the recovery link signs the user in.
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Refreshes the auth session cookie and guards routes.
export async function updateSession(request: NextRequest) {
  // An email or Google link whose redirect Supabase did not accept lands on the
  // Site URL ("/") with the code attached: finish the sign-in at the callback.
  const { searchParams } = request.nextUrl;
  if (request.nextUrl.pathname === "/" && (searchParams.has("code") || searchParams.has("token_hash"))) {
    const callback = new URL(`/auth/callback${request.nextUrl.search}`, request.url);
    if (!callback.searchParams.has("next")) {
      callback.searchParams.set("next", searchParams.get("type") === "recovery" ? "/reset-password" : "/home");
    }
    return NextResponse.redirect(callback);
  }

  let response = NextResponse.next({ request });

  const env = getSupabaseEnv();
  if (!env) return response;

  const supabase = createServerClient<Database>(env.url, env.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Validates the token and triggers a refresh when it is about to expire.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims.sub);
  const { pathname, search } = request.nextUrl;

  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!signedIn && matches(pathname, PROTECTED_PREFIXES)) {
    return redirectTo(`/login?next=${encodeURIComponent(pathname + search)}`);
  }
  if (signedIn && matches(pathname, AUTH_PAGES)) {
    return redirectTo("/home");
  }

  return response;
}
