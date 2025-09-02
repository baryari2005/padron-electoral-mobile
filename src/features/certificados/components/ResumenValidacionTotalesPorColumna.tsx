// src/features/certificados/components/ResumenValidacionTotalesPorColumna.tsx
"use client";

import { useMemo } from "react";
import { useWatch, type Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, TriangleAlert } from "lucide-react";
import type { CertificadoFormData } from "../utils/schema/schema";
import { useInconsistenciasPorColumna } from "@/features/certificados/wizard/hooks/useInconsistenciasPorColumna";

interface Categoria { id: string; nombre: string; }
interface Props { control: Control<CertificadoFormData>; categorias: Categoria[]; }

const NUM_COL_MIN_PX = 48;

export function ResumenValidacionTotalesPorColumna({ control, categorias }: Props) {
  const sobres = Number(useWatch({ control, name: "totales.sobres" }) || 0);

  // 🔁 cálculo compartido
  const { data, columnasInconsistentes } = useInconsistenciasPorColumna(control, categorias);

  const colPercent = useMemo(() => {
    const base = categorias.length ? Math.floor(52 / categorias.length) : 22;
    return Math.max(14, Math.min(22, base));
  }, [categorias.length]);

  const gridStyle = useMemo<React.CSSProperties>(() => {
    const numCol = `minmax(${NUM_COL_MIN_PX}px, ${colPercent}%)`;
    return { gridTemplateColumns: `minmax(0,1fr) repeat(${categorias.length}, ${numCol})` };
  }, [categorias.length, colPercent]);

  return (
    <section className="bg-card border border-border rounded-2xl shadow-sm p-3 space-y-2 mt-3">
      <div style={gridStyle} className="grid font-semibold text-[11px] gap-1.5 px-1">
        <div className="uppercase tracking-wide">Validación</div>
        {categorias.map((cat) => (
          <div key={cat.id} className="uppercase text-center leading-tight break-words px-0.5">
            {cat.nombre}
          </div>
        ))}
      </div>

      <Separator className="my-1" />

      <div style={gridStyle} className="grid items-center gap-1.5 p-1.5 rounded-md even:bg-muted/40">
        <div className="min-w-0 leading-tight">
          <div className="text-sm font-semibold uppercase truncate">Total de votos cargados</div>
          <div className="text-[10px] text-muted-foreground">Debe coincidir con sobres ({sobres})</div>
        </div>

        {data.map((cat) => (
          <div key={cat.id} className="relative">
            <Input
              value={cat.total}
              disabled
              className={`h-7 text-sm font-semibold px-1 text-center w-full tabular-nums
                ${cat.coincide
                  ? "text-emerald-800 border-emerald-400 bg-emerald-50"
                  : "text-red-800 border-red-400 bg-red-50"}`}
            />
            {cat.coincide
              ? <CheckCircle className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
              : <XCircle     className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />}
          </div>
        ))}
      </div>
    </section>
  );
}
