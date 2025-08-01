import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Replace with your actual session cookie name, if customized in BetterAuth config
const SESSION_COOKIE_NAME = "session_token";

// Check if we're in Vercel preview mode
function isVercelPreview(request: NextRequest): boolean {
  const vercelEnv = request.headers.get('x-vercel-deployment-url') || 
                   process.env.VERCEL_ENV;
  return vercelEnv !== undefined && vercelEnv !== "production";
}

export function middleware(request: NextRequest) {
  // Skip authentication in Vercel preview environments
  if (isVercelPreview(request)) {
    return NextResponse.next();
  }

  // Check if any cookie name contains the session string
  const hasSessionCookie = Array.from(request.cookies.getAll()).some((cookie) =>
    cookie.name.includes(SESSION_COOKIE_NAME)
  );

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
