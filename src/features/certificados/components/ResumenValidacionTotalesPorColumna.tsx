// src/features/certificados/components/ResumenValidacionTotalesPorColumna.tsx
"use client";

import { useMemo } from "react";
import { useWatch, type Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, TriangleAlert } from "lucide-react";
import type { CertificadoFormData } from "../utils/schema/schema";

interface Categoria {
  id: string;
  nombre: string;
}

interface Props {
  control: Control<CertificadoFormData>;
  categorias: Categoria[];
}

// Helpers
const norm = (s: string) => (s ?? "").trim().toUpperCase();
const toN = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

// Mismo “tuning” de grilla densa que en los otros componentes
const NUM_COL_MIN_PX = 48;
const MAX_VAL = 999; // (por si querés reusar clamp en algún momento)

export function ResumenValidacionTotalesPorColumna({ control, categorias }: Props) {
  const sobres = toN(useWatch({ control, name: "totales.sobres" }));
  const votosEspeciales = useWatch({ control, name: "votosEspeciales" }) ?? {};
  const resultadosPresidenciales = useWatch({ control, name: "resultadosPresidenciales" }) ?? [];

  // Col % dinámico (14–22%) como en los otros
  const colPercent = useMemo(() => {
    const base = categorias.length ? Math.floor(52 / categorias.length) : 22;
    return Math.max(14, Math.min(22, base));
  }, [categorias.length]);

  const gridStyle = useMemo<React.CSSProperties>(() => {
    const numCol = `minmax(${NUM_COL_MIN_PX}px, ${colPercent}%)`;
    return { gridTemplateColumns: `minmax(0,1fr) repeat(${categorias.length}, ${numCol})` };
  }, [categorias.length, colPercent]);

  // Total por agrupaciones (presidenciales) por categoría — compatible con estructuras variadas
  const totalAgrPorCatId = useMemo(() => {
    const acc: Record<string, number> = {};
    const arr = (resultadosPresidenciales as any[]) ?? [];

    for (const cat of categorias) {
      const id = cat.id;
      const name = norm(cat.nombre);
      let sum = 0;

      for (const row of arr) {
        // A) Objeto votos por ID
        if (row?.votos && row.votos[id] != null) { sum += toN(row.votos[id]); continue; }
        if (row?.votosPorCategoria && row.votosPorCategoria[id] != null) { sum += toN(row.votosPorCategoria[id]); continue; }
        // B) Objeto votos por NOMBRE
        if (row?.votos && row.votos[name] != null) { sum += toN(row.votos[name]); continue; }
        // C) Filas por categoría
        const catRowName = norm(row?.categoria ?? row?.categoriaNombre ?? "");
        if (catRowName && catRowName === name) { sum += toN(row?.votos ?? row?.total ?? row?.totalVotos); continue; }
        // D) Campo plano por ID (como usás en el form)
        if (row && row[id] != null && typeof row[id] !== "object") { sum += toN(row[id]); continue; }
      }

      acc[id] = sum;
    }
    return acc;
  }, [resultadosPresidenciales, categorias]);

  // Suma de especiales (solo keys conocidas) por categoría
  const totalEspPorCatId = useMemo(() => {
    const acc: Record<string, number> = {};
    const keys = ["nulos", "recurridos", "impugnados", "comandoElectoral", "blancos"] as const;

    for (const cat of categorias) {
      const obj = (votosEspeciales as any)?.[cat.id] ?? {};
      acc[cat.id] = keys.reduce((s, k) => s + toN(obj[k]), 0);
    }
    return acc;
  }, [votosEspeciales, categorias]);

  // Datos para la grilla (total por columna y si coincide con sobres)
  const data = useMemo(() => {
    return categorias.map((cat) => {
      const total = toN(totalEspPorCatId[cat.id]) + toN(totalAgrPorCatId[cat.id]);
      const coincide = total === sobres;
      return {
        id: cat.id,
        nombre: cat.nombre.toUpperCase(),
        total,
        coincide,
      };
    });
  }, [categorias, totalEspPorCatId, totalAgrPorCatId, sobres]);

  const columnasInconsistentes = data.filter((c) => !c.coincide);

  return (
    <section className="bg-card border border-border rounded-2xl shadow-sm p-3 space-y-2 mt-3">
      {/* Encabezado compacto */}
      <div style={gridStyle} className="grid font-semibold text-[11px] gap-1.5 px-1">
        <div className="uppercase tracking-wide">Validación</div>
        {categorias.map((cat) => (
          <div key={cat.id} className="uppercase text-center leading-tight break-words px-0.5">
            {cat.nombre}
          </div>
        ))}
      </div>

      <Separator className="my-1" />

      {/* Fila de totales cargados (compacta) */}
      <div
        style={gridStyle}
        className="grid items-center gap-1.5 p-1.5 rounded-md even:bg-muted/40"
      >
        <div className="min-w-0 leading-tight">
          <div className="text-sm font-semibold uppercase truncate">
            Total de votos cargados
          </div>
          <div className="text-[10px] text-muted-foreground">
            Debe coincidir con sobres ({sobres})
          </div>
        </div>

        {data.map((cat) => (
          <div key={cat.id} className="relative">
            <Input
              value={cat.total}
              disabled
              className={`h-7 text-sm font-semibold px-1 text-center w-full tabular-nums
                ${cat.coincide
                  ? "text-emerald-800 border-emerald-400 bg-emerald-50"
                  : "text-red-800 border-red-400 bg-red-50"
                }`}
            />
            {cat.coincide ? (
              <CheckCircle className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
            )}
          </div>
        ))}
      </div>

      {/* Banner de inconsistencias (si aplica) */}
      {columnasInconsistentes.length > 0 && (
        <>
          <Separator className="my-1" />
          <div style={gridStyle} className="grid">
            <div className="col-span-full">
              <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-destructive/30 bg-destructive/10 text-sm text-destructive">
                <TriangleAlert className="w-4 h-4" />
                <span className="uppercase font-medium">Inconsistencias en el recuento de votos</span>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
