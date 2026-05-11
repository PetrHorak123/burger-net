import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const enabled = process.env.COUNTDOWN_ENABLED === "true";
  const eventDate = process.env.EVENT_DATE ?? "2026-05-13T17:00:00+02:00";

  const isCountdownActive = enabled && Date.now() < new Date(eventDate).getTime();
  if (!isCountdownActive) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Allow: countdown page, admin pages, API routes
  if (pathname === "/" || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Block everything else — redirect to the countdown
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)",
  ],
};
