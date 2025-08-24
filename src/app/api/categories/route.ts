// app/api/categories/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiFetch, ApiError } from "@/lib/api";

type Out = { id: string; nombre: string };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const all = url.searchParams.get("all");

  const reqAuth = req.headers.get("authorization");
  const cookieToken = (await cookies()).get(process.env.AUTH_COOKIE_NAME || "auth_token")?.value;
  const authHeader = reqAuth ?? (cookieToken ? `Bearer ${cookieToken}` : undefined);

  try {
    const data = await apiFetch<any>({
      path: `/categories${all ? `?all=${encodeURIComponent(all)}` : ""}`,
      init: { headers: authHeader ? { Authorization: authHeader } : {} },
    });

    const items = Array.isArray(data) ? data : (data?.items ?? []);
    const out: Out[] = items.map((c: any) => ({
      id: String(c.id ?? c._id ?? c.uuid),
      nombre: String(c.nombre ?? c.name ?? c.title ?? "Sin nombre"),
    }));

    return NextResponse.json(out);
  } catch (e: any) {
    if (e instanceof ApiError) {
      console.error("[categories] API error", {
        status: e.status,
        message: e.message,
        base: process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
        body: e.body,
      });
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[categories] Unknown error", e);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
