// app/api/establishments/[id]/available-tables/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> } // 👈 tip correcto
) {
  try {
    const { id: idStr } = await params;            // 👈 await antes de usar
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid establishment ID" }, { status: 400 });
    }

    const cookieStore = await cookies();           // en Next 15 es async
    const token = cookieStore.get("auth_token")?.value;

    // Proxy a tu backend
    const data = await apiFetch<{ items: any[] }>({
      path: `/establishments/${id}/available-tables`,
      init: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    });

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
