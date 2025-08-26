// app/api/app-auth/logout/route.ts
import { NextResponse } from "next/server";
export async function POST() {
  const res = NextResponse.json({ ok: true });
  // borra cualquier cookie conocida (ajustá nombres si usaste otros)
  ["auth_token", "token", "jwt"].forEach((name) =>
    res.cookies.set(name, "", { path: "/", maxAge: 0 })
  );
  return res;
}
