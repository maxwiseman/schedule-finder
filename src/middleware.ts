import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Replace with your actual session cookie name, if customized in BetterAuth config
const SESSION_COOKIE_NAME = "better-auth.session_token";

export function middleware(request: NextRequest) {
  // Grab the session cookie
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  // You can also check for auth headers if your setup requires
  // const authHeader = request.headers.get('authorization');

  // If no session cookie, redirect to sign-in
  if (!hasSessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }

  // If cookie exists, allow the request to proceed
  return NextResponse.next();
}

// You can fine-tune the matcher to protect only specific routes
export const config = {
  matcher: [
    // Protect all routes except those for public assets and the auth pages
    "/((?!api|_next/static|_next/image|favicon.ico|sign-in|register).*)",
  ],
};
