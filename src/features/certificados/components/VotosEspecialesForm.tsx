// src/features/certificados/components/VotosEspecialesForm.tsx
"use client";

import { Control, useWatch, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import type { CertificadoFormData } from "../utils/schema/schema";
import { useEffect, useMemo } from "react";

interface Categoria {
  id: string;
  nombre: string;
}

const votoEspecialKeys = [
  // "nulos",
  // "recurridos",
  "impugnados",
  // "comandoElectoral",
  "blancos",
] as const;

type VotoEspecialKey = typeof votoEspecialKeys[number];

const items: { key: VotoEspecialKey; label: string; sub?: string }[] = [
  // { key: "nulos", label: "VOTOS NULOS" },
  // { key: "recurridos", label: "VOTOS RECURRIDOS", sub: "QUE SE REMITEN EN SOBRE N°3" },
  { key: "impugnados", label: "VOTOS DE IDENTIDAD IMPUGNADA", sub: "QUE SE REMITEN EN SOBRE N°3" },
  // { key: "comandoElectoral", label: "VOTOS DEL COMANDO ELECTORAL", sub: "QUE SE REMITEN EN EL BOLSÍN" },
  { key: "blancos", label: "VOTOS EN BLANCO" }, // ← calculado
];

// helpers
const norm = (s: string) => (s ?? "").trim().toUpperCase();
const toN = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

// —— DENSE TUNING (igual que en ResultadosPresidenciales) ——
const MAX_VAL = 999;
const NUM_COL_MIN_PX = 48;
const clamp3 = (v: string | number) => {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(MAX_VAL, n));
};

interface VotosEspecialesFormProps {
  control: Control<CertificadoFormData>;
  categorias: Categoria[];
}

export function VotosEspecialesForm({ control, categorias }: VotosEspecialesFormProps) {
  const { setValue, getValues } = useFormContext<CertificadoFormData>();

  // 👇 Paths usados
  const sobres = useWatch({ control, name: "totales.sobres" });
  const resultadosPresidenciales = useWatch({ control, name: "resultadosPresidenciales" });
  const especiales = useWatch({ control, name: "votosEspeciales" });

  // Inicializar a 0 campos faltantes (incluye "blancos")
  useEffect(() => {
    categorias.forEach((cat) => {
      items.forEach((item) => {
        const path = `votosEspeciales.${cat.id}.${item.key}` as const;
        const currentValue = getValues(path);
        if (currentValue === undefined || currentValue === null) {
          setValue(path, 0, { shouldDirty: false });
        }
      });
    });
  }, [categorias, getValues, setValue]);

  // —— TOTAL POR AGRUPACIONES (por categoría) para calcular "blancos" ——
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
        // D) Campo plano por ID
        if (row && row[id] != null && typeof row[id] !== "object") { sum += toN(row[id]); continue; }
      }

      acc[id] = sum;
    }

    return acc;
  }, [resultadosPresidenciales, categorias]);

  // Recalcular "blancos" por categoría (sobres − (agrupaciones + especiales sin blancos))
  useEffect(() => {
    const totalSobres = toN(sobres);

    for (const cat of categorias) {
      const espCat = (especiales as any)?.[cat.id] ?? {};

      // const sumaEspecialesSinBlancos =
      //   toN(espCat.nulos) +
      //   toN(espCat.recurridos) +
      //   toN(espCat.impugnados) +
      //   toN(espCat.comandoElectoral);
      const sumaEspecialesSinBlancos = toN(espCat.impugnados);

      const totalAgr = totalAgrPorCatId[cat.id] ?? 0;
      let blancos = totalSobres - (totalAgr + sumaEspecialesSinBlancos);
      if (blancos < 0) blancos = 0;

      const path = `votosEspeciales.${cat.id}.blancos` as const;
      if (toN(getValues(path)) !== blancos) {
        setValue(path, blancos, { shouldValidate: true, shouldDirty: false });
      }
    }
  }, [sobres, especiales, totalAgrPorCatId, categorias, setValue, getValues]);

  // —— Grilla responsive igual a ResultadosPresidenciales ——
  const colPercent = useMemo(() => {
    const base = categorias.length ? Math.floor(52 / categorias.length) : 22;
    return Math.max(14, Math.min(22, base)); // 14–22%
  }, [categorias.length]);

  const gridStyle = useMemo<React.CSSProperties>(() => {
    const numCol = `minmax(${NUM_COL_MIN_PX}px, ${colPercent}%)`;
    return { gridTemplateColumns: `minmax(0,1fr) repeat(${categorias.length}, ${numCol})` };
  }, [categorias.length, colPercent]);

  // Totales por categoría (suma de todos los ítems especiales, incluyendo blancos)
  const totalesPorCat = useMemo(() => {
    const t: Record<string, number> = {};
    for (const cat of categorias) {
      const espCat = (especiales as any)?.[cat.id] ?? {};
      t[cat.id] = votoEspecialKeys.reduce((s, k) => s + toN(espCat[k]), 0);
    }
    return t;
  }, [especiales, categorias]);

  return (
    <section className="bg-card border border-border rounded-2xl shadow-sm p-3 space-y-2">
      {/* Encabezado compacto */}
      <div style={gridStyle} className="grid font-semibold text-[11px] gap-1.5 px-1">
        <div className="uppercase tracking-wide">Voto Especial</div>
        {categorias.map((cat) => (
          <div key={cat.id} className="uppercase text-center leading-tight break-words px-0.5">
            {cat.nombre}
          </div>
        ))}
      </div>

      <Separator className="my-1" />

      {/* Filas compactas */}
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.key}
            style={gridStyle}
            className="grid items-center gap-1.5 even:bg-muted/40 p-1.5 rounded-md"
          >
            {/* Columna 1: etiqueta + sub */}
            <div className="min-w-0 leading-tight">
              <div className="text-sm font-semibold uppercase truncate" title={item.label}>
                {item.label}
              </div>
              {item.sub && (
                <div className="text-[10px] text-muted-foreground">{item.sub}</div>
              )}
            </div>

            {/* Celdas numéricas súper compactas */}
            {categorias.map((cat) => {
              const isBlancos = item.key === "blancos";
              return (
                <FormField
                  key={cat.id}
                  name={`votosEspeciales.${cat.id}.${item.key}` as const}
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
                            isBlancos ? "bg-muted/60 opacity-70 cursor-not-allowed" : ""
                          }`}
                          value={field.value ?? 0}
                          readOnly={isBlancos}
                          tabIndex={isBlancos ? -1 : 0}
                          onChange={
                            isBlancos
                              ? undefined
                              : (e) => field.onChange(clamp3(e.currentTarget.value))
                          }
                          onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                          aria-readonly={isBlancos}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>

      <Separator className="my-1" />

      {/* Totales compactos (por categoría) */}
      <div style={gridStyle} className="grid font-semibold text-[13px] items-center mt-3">
        <div className="uppercase">Total votos especiales</div>
        {categorias.map((cat) => (
          <div key={cat.id} className="text-right mr-0.5 tabular-nums">
            {totalesPorCat[cat.id] ?? 0}
          </div>
        ))}
      </div>
    </section>
  );
}
