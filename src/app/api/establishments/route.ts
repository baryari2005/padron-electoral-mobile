import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiFetch, ApiError } from "@/lib/api"; // usa el helper server-side

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const all = url.searchParams.get("all");

  // auth: toma Authorization del request o cookie
  const reqAuth = req.headers.get("authorization");
  const cookieToken = (await cookies()).get(process.env.AUTH_COOKIE_NAME || "auth_token")?.value;
  const authHeader = reqAuth ?? (cookieToken ? `Bearer ${cookieToken}` : undefined);

  try {
    // Llama al backend REAL
    const backend = await apiFetch<any>({
      path: `/establishments${all ? `?all=${encodeURIComponent(all)}` : ""}`,
      init: { headers: authHeader ? { Authorization: authHeader } : {} },
    });

    // Normalización flexible
    let items: any[] = [];
    if (Array.isArray(backend)) {
      items = backend;
    } else if (backend?.items && Array.isArray(backend.items)) {
      items = backend.items;
    } else if (backend?.data?.items && Array.isArray(backend.data.items)) {
      items = backend.data.items;
    } else {
      // Si el backend cambió el shape, devolvé crudo para inspeccionar en el cliente
      return NextResponse.json(backend);
    }

    return NextResponse.json(items);
  } catch (e: any) {
    if (e instanceof ApiError) {
      console.error("[establishments] API error", { status: e.status, message: e.message, base: process.env.API_BASE_URL, body: e.body });
      return NextResponse.json({ error: e.message, details: e.body }, { status: e.status });
    }
    console.error("[establishments] Unknown error", e);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
