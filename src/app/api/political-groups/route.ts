// app/api/political-groups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  try {
    // 👈 en Route Handlers, cookies() es async en tu versión
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    const search = new URL(req.url).search || "";

    // Proxy hacia tu backend real
    const data = await apiFetch<any>({
      path: `/political-groups${search}`,
      init: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    });

    // Normalizamos salida: si backend manda {items, total}, respondemos items
    const items = Array.isArray(data) ? data : data?.items ?? [];

    return NextResponse.json(items);
  } catch (e: any) {
    console.error("[political-groups] API error", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
