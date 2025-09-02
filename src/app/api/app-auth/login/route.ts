export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ENV } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const upstream = await fetch(`${ENV.API_BASE_URL}${ENV.AUTH_LOGIN_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: body.identifier, password: body.password }),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(data, { status: upstream.status });
    }

    // 👇 guardamos la cookie HttpOnly para que /api/app-auth/me funcione sin header
    const res = NextResponse.json(data);
    if (data?.token) {
      res.cookies.set("auth_token", data.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 días
      });
    }
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
