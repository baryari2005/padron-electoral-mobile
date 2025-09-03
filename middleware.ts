// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Solo redirige la raíz a /login. Nada de cookies acá.
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Dejá pasar estáticos/PWA/API/login
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/sw");
  if (isPublic) return NextResponse.next();

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = search;
    return NextResponse.redirect(url);
  }

  // El resto lo decide el cliente (RequireAuth)
  return NextResponse.next();
}

// Solo matcheá la raíz (no interceptes /certificados, etc.)
export const config = {
  matcher: ["/"],
};
