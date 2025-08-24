// src/features/certificados/hooks/usePermisosMatriz.ts
"use client";

import { useEffect, useState } from "react";

type Regla = {
  agrupacionId: number | string;
  cargoId: number | string;
  allowed?: boolean;
  eleccionId?: number | string | null;
};

type MatrizSets = Record<number, Set<number>>;

function normalizePermisos(input: any): MatrizSets {
  const out: MatrizSets = {};

  // Caso A: viene un array de reglas
  if (Array.isArray(input)) {
    for (const r of input as Regla[]) {
      if (!r) continue;
      if (r.allowed === false) continue;
      const gid = Number((r as any).agrupacionId);
      const cid = Number((r as any).cargoId);
      if (!Number.isFinite(gid) || !Number.isFinite(cid)) continue;
      (out[gid] ??= new Set<number>()).add(cid);
    }
    return out;
  }

  // Caso B: viene { byGroup: {...} } o directamente { [agrupacionId]: algo }
  const obj = input?.byGroup ?? input;
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      const gid = Number(k);
      if (!Number.isFinite(gid)) continue;

      if (v instanceof Set) {
        out[gid] = v as Set<number>;
        continue;
      }
      if (Array.isArray(v)) {
        out[gid] = new Set((v as any[]).map((x) => Number(x)).filter(Number.isFinite));
        continue;
      }
      if (v && typeof v === "object") {
        // soporta { cargos:[...] } o valores numéricos sueltos
        const arr = Array.isArray((v as any).cargos)
          ? (v as any).cargos
          : Object.values(v as any);
        out[gid] = new Set(
          (arr as any[]).map((x) => Number(x)).filter(Number.isFinite)
        );
        continue;
      }

      // último recurso: nada válido → set vacío
      out[gid] = new Set();
    }
    return out;
  }

  // Si no reconocemos el shape, devolvemos vacío (y logueamos para depurar)
  console.warn("[usePermisosMatriz] payload no reconocido:", input);
  return out;
}

export function usePermisosMatriz({ ready }: { ready: boolean }) {
  const [habilitadosPorAgrupacion, setMatriz] = useState<MatrizSets>({});
  const [loadingPermisos, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    setLoading(true);

    fetch("/api/political-groups/permissions-matrix", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (r) => {
        const payload = await r.json().catch(() => null);
        const sets = normalizePermisos(payload);
        if (alive) setMatriz(sets);
      })
      .catch((err) => {
        console.error("❌ Error cargando matriz permisos", err);
        if (alive) setMatriz({});
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [ready]);

  return { habilitadosPorAgrupacion, loadingPermisos };
}
