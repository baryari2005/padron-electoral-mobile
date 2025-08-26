// app/api/app-auth/login/route.ts
import { NextResponse } from "next/server";
import { ENV } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) ?? {};
    const payload = {
      email: body.email ?? body.identifier ?? body.username ?? body.user,
      username: body.username ?? body.identifier ?? body.email ?? body.user,
      identifier: body.identifier ?? body.email ?? body.username ?? body.user,
      password: body.password ?? body.pass,
      ...body,
    };

    if (!payload.email && !payload.username && !payload.identifier) {
      return NextResponse.json({ error: "Falta email/username" }, { status: 400 });
    }
    if (!payload.password) {
      return NextResponse.json({ error: "Falta password" }, { status: 400 });
    }

    const upstream = await fetch(`${ENV.API_BASE_URL}${ENV.AUTH_LOGIN_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await upstream.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return { raw: text }; } })() : {};

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.message || data?.error || "Login rechazado", details: data },
        { status: upstream.status }
      );
    }

    const token: string | undefined =
      (data as any).token ?? (data as any).access_token ?? (data as any).jwt ?? (data as any).data?.token;

    if (!token) {
      return NextResponse.json({ error: "Respuesta de login sin token" }, { status: 502 });
    }

    // ⬇️ devolvemos el token en el body; NO cookies
    return new NextResponse(
      JSON.stringify({ ok: true, token, user: (data as any).user ?? (data as any).data?.user ?? null }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
