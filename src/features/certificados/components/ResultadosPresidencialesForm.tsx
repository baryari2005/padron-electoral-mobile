// src/features/certificados/components/ResultadosPresidencialesForm.tsx
"use client";

import { Control, useFieldArray, useWatch } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { getAvatarUrl } from "@/utils/avatar";
import { LogoConFallback } from "@/components/common/LogoWithFallback";
import type { CertificadoFormData } from "../utils/schema/schema";

type Categoria = { id: string; nombre: string };
type AgrupacionPolitica = { id: number; nombre?: string; numero?: number | string; profileImage?: string | null };

interface Props {
  control: Control<CertificadoFormData>;
  resultadosPresidenciales: CertificadoFormData["resultadosPresidenciales"];
  categorias: Categoria[];
  agrupaciones: AgrupacionPolitica[];
  habilitadosPorAgrupacion: Record<number, Set<number>>;
  loadingPermisos?: boolean;
}

function AvatarLogo({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="size-6 rounded-full ring-1 ring-border overflow-hidden bg-muted shrink-0">
      <LogoConFallback src={src} alt={alt} className="w-full h-full object-cover" unoptimized />
    </div>
  );
}

const isPlaceholder = (s?: string) => {
  if (!s) return true;
  const t = s.trim().toUpperCase();
  return t === "" || t === "SIN NOMBRE" || t === "S/N" || t === "SN";
};

export function ResultadosPresidencialesForm({
  control,
  resultadosPresidenciales,
  categorias,
  agrupaciones,
  habilitadosPorAgrupacion,
  loadingPermisos = false,
}: Props) {
  const { fields, replace } = useFieldArray({ control, name: "resultadosPresidenciales" });

  // sincronicemos la longitud si cambia arriba
  useEffect(() => {
    if (Array.isArray(resultadosPresidenciales) && resultadosPresidenciales.length !== fields.length) {
      replace(resultadosPresidenciales as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultadosPresidenciales, replace]);

  const valores = useWatch({ control, name: "resultadosPresidenciales" });
  const [totales, setTotales] = useState<Record<string, number>>({});

  useEffect(() => {
    const t: Record<string, number> = {};
    categorias.forEach((cat) => {
      t[cat.id] = (valores as any[])?.reduce((sum, r) => sum + (Number(r?.[cat.id]) || 0), 0) || 0;
    });
    setTotales(t);
  }, [valores, categorias]);

  // habilitaciones
  const isHabilitado = (agrupacionId: number | undefined, catId: string) => {
    if (!agrupacionId || loadingPermisos) return false;
    const set = habilitadosPorAgrupacion[agrupacionId];
    return !!set?.has(Number(catId));
  };

  // —— layout denso ——
  const MAX_VAL = 999;
  const NUM_COL_MIN_PX = 48;
  const colPercent = useMemo(() => {
    const base = categorias.length ? Math.floor(52 / categorias.length) : 22;
    return Math.max(14, Math.min(22, base));
  }, [categorias.length]);

  const gridStyle = useMemo<React.CSSProperties>(() => {
    const numCol = `minmax(${NUM_COL_MIN_PX}px, ${colPercent}%)`;
    return { gridTemplateColumns: `minmax(0,1fr) repeat(${categorias.length}, ${numCol})` };
  }, [categorias.length, colPercent]);

  const clamp3 = (v: string | number) => {
    const n = Number(v);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(MAX_VAL, n));
  };

  // listo si TODAS las agrupaciones tienen nombre no-placeholder
  const agrupacionesReady =
    agrupaciones.length > 0 && agrupaciones.every((a) => !isPlaceholder(a?.nombre));

  if (!agrupacionesReady) {
    return (
      <section className="bg-card border border-border rounded-2xl shadow-sm p-4">
        <div className="text-sm text-muted-foreground">Cargando agrupaciones…</div>
      </section>
    );
  }

  return (
    <section className="bg-card border border-border rounded-2xl shadow-sm p-3 space-y-2">
      {/* Encabezado */}
      <div style={gridStyle} className="grid font-semibold text-[11px] gap-1.5 px-1">
        <div className="uppercase tracking-wide">Agrupación</div>
        {categorias.map((cat) => (
          <div key={cat.id} className="uppercase text-center leading-tight break-words px-0.5">
            {cat.nombre}
          </div>
        ))}
      </div>

      <Separator className="my-1" />

      {/* Filas */}
      <div className="space-y-1">
        {fields.map((field, index) => {
          const row = (resultadosPresidenciales[index] as any) ?? {};
          const ag = agrupaciones[index]; // asumimos mismo orden; si no, matchear por id
          const agrupacionId: number | undefined = ag?.id ?? row?.agrupacionId;

          const displayNombre =
            ag?.nombre && !isPlaceholder(ag?.nombre)
              ? ag.nombre
              : (row?.nombre as string) ?? `Agrupación #${agrupacionId ?? "?"}`;

          const displayNumero = ag?.numero ?? row?.numero ?? "";

          const imagen = getAvatarUrl(
            String(displayNombre || ""),
            (ag?.profileImage ?? row?.profileImage ?? undefined) as string | undefined
          );

          return (
            <div
              key={field.id}
              style={gridStyle}
              className="grid items-center gap-1.5 even:bg-muted/40 p-1.5 rounded-md"
            >
              {/* Columna 1: avatar + texto truncado */}
              <div className="min-w-0 flex items-center gap-2">
                <AvatarLogo src={imagen} alt={String(displayNombre)} />
                <div className="min-w-0 leading-tight">
                  <div
                    className="text-sm font-semibold uppercase truncate"
                    title={displayNumero ? `Lista ${displayNumero} - ${displayNombre}` : String(displayNombre)}
                  >
                    {displayNombre}
                  </div>
                </div>
              </div>

              {/* Celdas numéricas */}
              {categorias.map((cat) => {
                const habilitado = isHabilitado(agrupacionId, cat.id);
                return (
                  <FormField
                    key={cat.id}
                    name={`resultadosPresidenciales.${index}.${cat.id}` as const}
                    control={control}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            enterKeyHint="next"
                            min={0}
                            max={MAX_VAL}
                            placeholder="0"
                            className={`h-7 text-sm font-semibold text-muted-foreground px-1 text-right w-full tabular-nums ${
                              !habilitado ? "bg-muted/60 opacity-70 cursor-not-allowed" : ""
                            }`}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(clamp3(e.currentTarget.value))}
                            onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                            disabled={!habilitado}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      <Separator className="my-1" />

      {/* Totales */}
      <div style={gridStyle} className="grid font-semibold text-[13px] items-center mt-3">
        <div className="uppercase">Total de votos por partido.</div>
        {categorias.map((cat) => (
          <div key={cat.id} className="text-right mr-6 tabular-nums">
            {totales[cat.id] ?? 0}
          </div>
        ))}
      </div>
    </section>
  );
}
