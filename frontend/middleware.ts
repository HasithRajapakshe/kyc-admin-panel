import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC = ["/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for token
  const token =
    req.cookies.get("access_token") ||
    req.cookies.get("session");

  if (!token) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};