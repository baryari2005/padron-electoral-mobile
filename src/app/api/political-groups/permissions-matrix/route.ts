import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiFetch, ApiError } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Rule = {
  agrupacionId: number;
  cargoId: number;
  eleccionId: number | null;
  allowed: boolean;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const eleccionId = url.searchParams.get("eleccionId");

  // 1) Tomá Authorization del request o cookie
  const reqAuth = req.headers.get("authorization");
  const cookieToken = (await cookies()).get(process.env.AUTH_COOKIE_NAME || "auth_token")?.value;
  const authHeader =
    reqAuth ??
    (cookieToken ? `Bearer ${cookieToken}` : undefined);

  try {
    // 2) Llamá al backend real
    const path =
      `/political-groups/permissions-matrix` +
      (eleccionId ? `?eleccionId=${encodeURIComponent(eleccionId)}&includeGlobal=1` : `?includeGlobal=1`);

    const rules = await apiFetch<Rule[]>({
      path,
      init: { headers: authHeader ? { Authorization: authHeader } : {} },
    });

    // Si tu hook espera ya reducido, lo podés reducir acá;
    // por ahora devolvemos tal cual lo que envíe el backend.
    return NextResponse.json(rules);
  } catch (e: any) {
    // 3) Propagá status y dejá log útil
    if (e instanceof ApiError) {
      console.error("[permissions-matrix] API error", {
        status: e.status,
        message: e.message,
        body: e.body,
        base: process.env.NEXT_PUBLIC_API_URL,
      });
      return NextResponse.json({ error: e.message, details: e.body }, { status: e.status });
    }
    console.error("[permissions-matrix] Unknown error", e);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
