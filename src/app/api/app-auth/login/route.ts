import { NextResponse } from "next/server";
import { ENV } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) ?? {};
    // Mapeo flexible: muchos backends piden 'identifier' o 'username'
    const payload = {
      email: body.email ?? body.identifier ?? body.username ?? body.user,
      username: body.username ?? body.identifier ?? body.email ?? body.user,
      identifier: body.identifier ?? body.email ?? body.username ?? body.user,
      password: body.password ?? body.pass,
      ...body, // deja que tu backend ignore lo que no use
    };

    if (!payload.email && !payload.username && !payload.identifier) {
      return NextResponse.json({ error: "Falta email/username" }, { status: 400 });
    }
    if (!payload.password) {
      return NextResponse.json({ error: "Falta password" }, { status: 400 });
    }

    // Log útil en servidor (se ve en consola)
    console.log("[LOGIN] upstream =>", `${ENV.API_BASE_URL}${ENV.AUTH_LOGIN_PATH}`);

    const upstream = await fetch(`${ENV.API_BASE_URL}${ENV.AUTH_LOGIN_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await upstream.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

    if (!upstream.ok) {
      console.error("[LOGIN] upstream error", upstream.status, data);
      return NextResponse.json(
        { error: data?.message || data?.error || "Login rechazado", details: data },
        { status: upstream.status }
      );
    }

    // Token puede venir de varias formas
    const token: string | undefined =
      data.token ?? data.access_token ?? data.jwt ?? data.data?.token;

    if (!token) {
      console.error("[LOGIN] sin token en respuesta:", data);
      return NextResponse.json({ error: "Respuesta de login sin token" }, { status: 502 });
    }

    const res = NextResponse.json({ ok: true, user: data.user ?? data.data?.user ?? null });

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8h
    });

    return res;
  } catch (e: any) {
    console.error("[LOGIN] exception", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
