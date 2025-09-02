// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname === "/login") {
    const res = NextResponse.next();

    // 1) borrar cookie de sesión
    res.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });

    // 2) no-cache fuerte
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");

    // 3) opcional (Chromium): limpia cache+storage+cookies
    // Safari no lo soporta, pero no rompe.
    res.headers.set("Clear-Site-Data", '"cache", "storage", "cookies"');

    return res;
  }

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = search;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/", "/login"] };
