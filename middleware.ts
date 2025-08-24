// middleware.ts (raíz del proyecto)
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // públicos (evitar loops / bloquear estáticos/PWA)
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

  // 👇 redirección para la raíz
  if (pathname === "/") {
    const token = req.cookies.get("auth_token")?.value;
    const url = req.nextUrl.clone();
    url.pathname = token ? "/certificados/nuevo" : "/login";
    // opcional: preservar query, por ejemplo ?next=...
    url.search = search;
    return NextResponse.redirect(url);
  }

  // Rutas protegidas
  const protectedPrefixes = ["/certificados"];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    const login = req.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/certificados/:path*"], // incluimos la raíz
};
