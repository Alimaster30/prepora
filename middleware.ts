import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/verify-email",
  "/privacy",
  "/terms",
];

export function middleware(request: NextRequest) {
  const hasSession =
    Boolean(request.cookies.get("session")?.value) ||
    Boolean(request.cookies.get("prepora_session")?.value) ||
    Boolean(request.cookies.get("prepora_google_session")?.value);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    const expectedOrigin = configuredOrigin || request.nextUrl.origin;
    if (!origin || origin.replace(/\/$/, "") !== expectedOrigin) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }
  }

  if (pathname.startsWith("/api/")) return NextResponse.next();

  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/resume-share/");
  // If NOT authenticated and accessing a protected route → redirect to sign-in
  if (!isPublicRoute && !hasSession) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
