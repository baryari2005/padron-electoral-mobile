// app/api/scrutiny-certificates/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { ENV } from '@/lib/env';

const BASE = ENV.API_BASE_URL;

function tryJson(text: string) {
  try { return JSON.parse(text); } catch { return text; }
}

/**
 * Adapta el payload del cliente al contrato del backend:
 * - mesa: { numeroMesa, escuelaId, circuitoId }
 * - resultadosPresidenciales: [{ id: agrupacionId, "1": votos, "2": votos, ... }]
 *
 * Soporta estos inputs:
 * A) shape ya correcto (con mesa.numeroMesa y resultadosPresidenciales)
 * B) shape “API intermedio” (establecimientoId/numeroMesa + resultados[])
 * C) shape del form (mesa.{escuelaId, numeroMesa, circuitoId} + resultadosPresidenciales[])
 */
function toBackendPayload(input: any) {
  // A) Si ya cumple el contrato, devolvemos tal cual.
  const hasMesaCorrecta =
    input?.mesa &&
    (input.mesa.numeroMesa ?? input.mesa.numero) != null && // toleramos "numero"
    (input.mesa.escuelaId ?? input.mesa.establecimientoId) != null &&
    input.mesa.circuitoId != null;

  if (hasMesaCorrecta && Array.isArray(input?.resultadosPresidenciales)) {
    // normalizamos nombre "numero" -> "numeroMesa" si viniera así
    if (input.mesa.numero != null && input.mesa.numeroMesa == null) {
      input.mesa.numeroMesa = Number(input.mesa.numero);
      delete input.mesa.numero;
    }
    if (input.mesa.establecimientoId != null && input.mesa.escuelaId == null) {
      input.mesa.escuelaId = String(input.mesa.establecimientoId);
      delete input.mesa.establecimientoId;
    }
    return input;
  }

  // Campos sueltos comunes
  const escuelaId =
    input?.mesa?.escuelaId ??
    input?.mesa?.establecimientoId ??
    input?.establecimientoId ??
    "";
  const numeroMesaRaw =
    input?.mesa?.numeroMesa ??
    input?.mesa?.numero ??
    input?.numeroMesa;
  const circuitoIdRaw =
    input?.mesa?.circuitoId ??
    input?.circuitoId;

  const mesa = {
    escuelaId: String(escuelaId ?? ""),
    numeroMesa: Number(numeroMesaRaw ?? NaN),
    circuitoId: Number(circuitoIdRaw ?? NaN),
  };

  // totales y votosEspeciales pasan casi directos
  const totales = input?.totales ?? {};
  const votosEspeciales = input?.votosEspeciales ?? {};

  // B) Si viene “resultados” como array [{categoria, agrupacionId, votos}], lo agrupamos
  if (Array.isArray(input?.resultados)) {
    const byGroup: Record<string, Record<string, number>> = {};
    for (const r of input.resultados) {
      const agId = String(r?.agrupacionId ?? "");
      const catId = String(r?.categoria ?? "");
      const votos = Number(r?.votos ?? 0);
      if (!agId || !/^\d+$/.test(catId)) continue;
      byGroup[agId] = byGroup[agId] || {};
      byGroup[agId][catId] = votos;
    }
    const resultadosPresidenciales = Object.entries(byGroup).map(([ag, cats]) => ({
      id: Number(ag),
      ...cats, // "1": n, "2": n, ...
    }));
    return { mesa, totales, votosEspeciales, resultadosPresidenciales };
  }

  // C) Si ya viene “resultadosPresidenciales” del form, solo aseguramos id correcto
  if (Array.isArray(input?.resultadosPresidenciales)) {
    const resultadosPresidenciales = input.resultadosPresidenciales.map((row: any) => {
      // del form a veces viene "agrupacionId" en vez de "id"
      const id = row?.id ?? row?.agrupacionId;
      const out: any = { id: Number(id) };
      for (const [k, v] of Object.entries(row ?? {})) {
        if (/^\d+$/.test(k)) out[k] = Number(v ?? 0);
      }
      return out;
    });
    return { mesa, totales, votosEspeciales, resultadosPresidenciales };
  }

  // Fallback: devolvemos lo mejor que podamos
  return { mesa, totales, votosEspeciales, resultadosPresidenciales: [] };
}

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    if (!BASE) {
      return NextResponse.json(
        { error: "API base URL no configurada (NEXT_PUBLIC_API_URL / API_URL)" },
        { status: 500 }
      );
    }

    const raw = await req.json();
    const payload = toBackendPayload(raw);

    // Validación mínima antes de enviar al upstream
    if (!payload?.mesa?.escuelaId || !payload?.mesa?.numeroMesa || !payload?.mesa?.circuitoId) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios en 'mesa' (escuelaId, numeroMesa, circuitoId)" },
        { status: 400 }
      );
    }

    console.log("▶ proxy /scrutiny-certificates →", {
      base: BASE,
      hasToken: Boolean(token),
      mesa: payload.mesa,
      resultadosLen: Array.isArray(payload?.resultadosPresidenciales) ? payload.resultadosPresidenciales.length : 0,
    });

    const upstream = await fetch(`${BASE}/scrutiny-certificates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
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
