// app/api/scrutiny-certificates/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ENV } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASE = ENV.API_BASE_URL;

const toInt = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};
const tryJson = (text: string) => { try { return JSON.parse(text); } catch { return text; } };
const bearer = (raw?: string | null) => {
  if (!raw) return null;
  return /^Bearer\s/i.test(raw) ? raw : `Bearer ${raw}`;
};

/**
 * Normaliza el payload al contrato del backend
 */
function toBackendPayload(input: any) {
  // Campos sueltos comunes (admite varias formas)
  const escuelaIdRaw =
    input?.mesa?.escuelaId ??
    input?.mesa?.establecimientoId ??
    input?.establecimientoId;

  const numeroMesaRaw =
    input?.mesa?.numeroMesa ??
    input?.mesa?.numero ??
    input?.numeroMesa;

  const circuitoIdRaw =
    input?.mesa?.circuitoId ??
    input?.circuitoId;

  const mesa = {
    // Coerción a NÚMERO (evita problemas de FK/validación)
    escuelaId: toInt(escuelaIdRaw),
    numeroMesa: toInt(numeroMesaRaw),
    circuitoId: toInt(circuitoIdRaw),
  };

  const totales = input?.totales ?? {};
  const votosEspeciales = input?.votosEspeciales ?? {};

  // B) resultados como [{ categoria, agrupacionId, votos }]
  if (Array.isArray(input?.resultados)) {
    const byGroup: Record<string, Record<string, number>> = {};
    for (const r of input.resultados) {
      const agId = String(r?.agrupacionId ?? "");
      const catId = String(r?.categoria ?? "");
      const votos = toInt(r?.votos ?? 0);
      if (!agId || !/^\d+$/.test(catId)) continue;
      byGroup[agId] ??= {};
      byGroup[agId][catId] = Number.isFinite(votos) ? votos : 0;
    }
    const resultadosPresidenciales = Object.entries(byGroup).map(([ag, cats]) => ({
      id: toInt(ag),
      ...cats,
    }));
    return { mesa, totales, votosEspeciales, resultadosPresidenciales };
  }

  // C) resultadosPresidenciales con filas por agrupación
  if (Array.isArray(input?.resultadosPresidenciales)) {
    const resultadosPresidenciales = input.resultadosPresidenciales.map((row: any) => {
      const id = row?.id ?? row?.agrupacionId;
      const out: any = { id: toInt(id) };
      for (const [k, v] of Object.entries(row ?? {})) {
        if (/^\d+$/.test(k)) out[k] = Number.isFinite(Number(v)) ? Number(v) : 0;
      }
      return out;
    });
    return { mesa, totales, votosEspeciales, resultadosPresidenciales };
  }

  // Fallback
  return { mesa, totales, votosEspeciales, resultadosPresidenciales: [] };
}

export async function POST(req: Request) {
  try {
    if (!BASE) {
      return NextResponse.json(
        { error: "API base URL no configurada (NEXT_PUBLIC_API_URL / API_URL)" },
        { status: 500 }
      );
    }

    // 1) Intentar token por HEADER (tu app lo manda en memoria)
    const headerAuth =
      req.headers.get("authorization") ??
      req.headers.get("Authorization") ??
      req.headers.get("x-access-token");

    // 2) Fallback: cookie (si alguna vez decidís usarla)
    const cookieStore = await cookies();                                  // 👈 FIX: usar await
    const cookieToken = cookieStore.get("auth_token")?.value ?? null;     // 👈 ahora sí .get

    // Normalizar a "Bearer <token>"
    const authHeader = bearer(headerAuth) ?? bearer(cookieToken);

    const raw = await req.json().catch(() => null);
    if (!raw) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

    const payload = toBackendPayload(raw);

    // Validación mínima (aseguramos números válidos)
    if (
      !Number.isFinite(payload?.mesa?.escuelaId) ||
      !Number.isFinite(payload?.mesa?.numeroMesa) ||
      !Number.isFinite(payload?.mesa?.circuitoId)
    ) {
      return NextResponse.json(
        { error: "Faltan datos válidos en 'mesa' (escuelaId, numeroMesa, circuitoId numéricos)" },
        { status: 400 }
      );
    }

    console.log("▶ proxy /scrutiny-certificates →", {
      base: BASE,
      hasToken: Boolean(authHeader),
      mesa: payload.mesa,
      resultadosLen: Array.isArray(payload?.resultadosPresidenciales)
        ? payload.resultadosPresidenciales.length
        : 0,
    });

    const upstream = await fetch(`${BASE}/scrutiny-certificates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await upstream.text();
    const body = tryJson(text);

    if (!upstream.ok) {
      console.error("⛔ Upstream error /scrutiny-certificates", upstream.status, body);
      return NextResponse.json(
        { error: "Upstream error", upstreamStatus: upstream.status, upstreamBody: body },
        { status: upstream.status }
      );
    }

    return NextResponse.json(body, { status: upstream.status || 201 });
  } catch (e: any) {
    console.error("Route error /scrutiny-certificates", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
