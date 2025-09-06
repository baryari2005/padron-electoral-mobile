// src/features/certificados/wizard/hooks/useInconsistenciasPorColumna.ts
"use client";
import { useMemo } from "react";
import { useWatch, type Control } from "react-hook-form";
import type { CertificadoFormData } from "../../utils/schema/schema";

type Categoria = { id: string; nombre: string };

const norm = (s?: string) => (s ?? "").trim().toUpperCase();
const toN = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export function useInconsistenciasPorColumna(
  control: Control<CertificadoFormData>,
  categorias: Categoria[]
) {
  const sobres = useWatch({ control, name: "totales.sobres" });
  const votosEspeciales = useWatch({ control, name: "votosEspeciales" }) ?? {};
  const resultadosPresidenciales = useWatch({ control, name: "resultadosPresidenciales" }) ?? [];

  const { data, columnasInconsistentes } = useMemo(() => {
    // A) suma por categoría de “resultados”
    const totalAgrPorCatId: Record<string, number> = {};
    const arr = (resultadosPresidenciales as any[]) ?? [];

    for (const cat of categorias) {
      const id = cat.id;
      const name = norm(cat.nombre);
      let sum = 0;

      for (const row of arr) {
        if (row?.votos && row.votos[id] != null) { sum += toN(row.votos[id]); continue; }
        if (row?.votosPorCategoria && row.votosPorCategoria[id] != null) { sum += toN(row.votosPorCategoria[id]); continue; }
        if (row?.votos && row.votos[name] != null) { sum += toN(row.votos[name]); continue; }
        const catRowName = norm(row?.categoria ?? row?.categoriaNombre ?? "");
        if (catRowName && catRowName === name) { sum += toN(row?.votos ?? row?.total ?? row?.totalVotos); continue; }
        if (row && row[id] != null && typeof row[id] !== "object") { sum += toN(row[id]); continue; }
      }
      totalAgrPorCatId[id] = sum;
    }

    // B) suma por categoría de “especiales”
    const totalEspPorCatId: Record<string, number> = {};
    // const keys = ["nulos","recurridos","impugnados","comandoElectoral","blancos"] as const;
    const keys = ["impugnados","blancos"] as const;
    for (const cat of categorias) {
      const obj = (votosEspeciales as any)?.[cat.id] ?? {};
      totalEspPorCatId[cat.id] = keys.reduce((s,k)=> s + toN(obj[k]), 0);
    }

    // C) totales por columna y chequeo contra sobres
    const data = categorias.map((cat) => {
      const total = toN(totalEspPorCatId[cat.id]) + toN(totalAgrPorCatId[cat.id]);
      const coincide = total === toN(sobres);
      return { id: cat.id, nombre: cat.nombre, total, coincide };
    });

    const columnasInconsistentes = data.filter(d => !d.coincide).map(d => d.id);

    return { data, columnasInconsistentes };
  }, [categorias, votosEspeciales, resultadosPresidenciales, sobres]);

  return {
    data,                              // [{id, nombre, total, coincide}]
    columnasInconsistentes,            // string[]
    hayInconsistenciasColumna: columnasInconsistentes.length > 0,
  };
}
