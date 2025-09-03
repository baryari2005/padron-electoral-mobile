// app/api/app-auth/logout/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // Borra la cookie httpOnly de sesión
  res.cookies.set("auth_token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  // (Opcional) Si alguna vez guardaste un 'token' legible por JS:
  res.cookies.set("token", "", {
    path: "/",
    expires: new Date(0),
  });

  return res;
}
