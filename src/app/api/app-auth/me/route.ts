// app/api/app-auth/me/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ENV } from "@/lib/env";

const mask = (t?: string | null) => (t ? `${t.slice(0, 8)}...${t.slice(-4)}` : "null");

export async function GET(req: Request) {

  console.log("[/api/app-auth/me] HIT", req);  // <--- TIENE QUE APARECER
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("auth_token")?.value ?? null;

    const authHeader = req.headers.get("authorization");
    const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    const token = headerToken ?? cookieToken;

    console.log("[/me] header?", !!headerToken, "cookie?", !!cookieToken, "usando:", mask(token));
    if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });

    const upstream = await fetch(`${ENV.API_BASE_URL}${ENV.AUTH_ME_PATH}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));
    console.log("[/me] upstream status:", upstream.status);

    if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });
    return NextResponse.json(data);
  } catch (e: any) {
    console.error("[/me] error:", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
