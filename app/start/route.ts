import { NextResponse, type NextRequest } from "next/server";
import { getUserId } from "@/lib/auth";
import { FIND_QUERY_COOKIE } from "@/lib/find-query-cookie";

// Welcome-page search: "I need a backend developer for a hackathon".
// Signed in: straight to Find people. Otherwise remember the text through
// sign-up and onboarding (finishOnboarding reads the cookie).
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 120);
  const findUrl = new URL(`/find?q=${encodeURIComponent(q)}`, request.url);

  if (await getUserId()) return NextResponse.redirect(q ? findUrl : new URL("/find", request.url));

  const response = NextResponse.redirect(new URL("/signup", request.url));
  if (q) {
    response.cookies.set(FIND_QUERY_COOKIE, q, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60, path: "/" });
  }
  return response;
}
