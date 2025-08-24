// src/features/certificados/components/ResultadosPresidencialesForm.tsx
"use client";

import { Control, useFieldArray, useWatch } from "react-hook-form";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { getAvatarUrl } from "@/utils/avatar";
import { LogoConFallback } from "@/components/common/LogoWithFallback";
import type { CertificadoFormData } from "../utils/schema/schema";

type Categoria = { id: string; nombre: string };
type AgrupacionPolitica = { id: number; nombre: string; numero?: number | string; profileImage?: string | null };

interface Props {
  control: Control<CertificadoFormData>;
  resultadosPresidenciales: CertificadoFormData["resultadosPresidenciales"];
  categorias: Categoria[];
  agrupaciones: AgrupacionPolitica[];
  habilitadosPorAgrupacion: Record<number, Set<number>>;
  loadingPermisos?: boolean;
}

export function ResultadosPresidencialesForm({
  control,
  resultadosPresidenciales,
  categorias,
  agrupaciones,
  habilitadosPorAgrupacion,
  loadingPermisos = false,
}: Props) {
  const { fields, replace } = useFieldArray({ control, name: "resultadosPresidenciales" });

  // 🔁 Mantener fields sincronizados con el array real
  useEffect(() => {
    if (Array.isArray(resultadosPresidenciales)) {
      // evita re-render infinito: sólo si difiere la longitud o el contenido básico
      if (resultadosPresidenciales.length !== fields.length) {
        replace(resultadosPresidenciales as any);
      }
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

  const isHabilitado = (agrupacionId: number | undefined, catId: string) => {
    if (!agrupacionId || loadingPermisos) return false;
    const set = habilitadosPorAgrupacion[agrupacionId];
    return !!set?.has(Number(catId));
    // si tu catId es string y en el set guardás string, quita el Number(...)
  };

  const gridStyle = { gridTemplateColumns: `60px 1fr repeat(${categorias.length}, 100px)` };

  return (
    <div className="space-y-4">
      <div style={gridStyle} className="grid font-semibold text-xs gap-2 px-2">
        <div>LOGO</div>
        <div>AGRUPACIONES POLITICAS</div>
        {categorias.map((cat) => (
          <div key={cat.id} className="text-center">{cat.nombre.toUpperCase()}</div>
        ))}
      </div>

      <Separator />

      {fields.map((field, index) => {
        const row = resultadosPresidenciales[index] as any;
        const nombre = row?.nombre ?? "SIN NOMBRE";
        const numero = row?.numero ?? "-";
        const imagen = getAvatarUrl(nombre, row?.profileImage ?? undefined);
        const agrupacionId = agrupaciones[index]?.id; // asumiendo mismo orden que rows

        return (
          <div key={field.id} style={gridStyle} className="grid items-center gap-2 even:bg-muted/50 p-2 rounded-md">
            <div><LogoConFallback src={imagen} alt={nombre} /></div>

            <div className="text-sm flex items-center gap-1 uppercase">
              Lista {numero} - {nombre}
            </div>

            {categorias.map((cat) => {
              const habilitado = isHabilitado(agrupacionId, cat.id);
              return (
                <FormField
                  key={cat.id}
                  name={`resultadosPresidenciales.${index}.${cat.id}` as const}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className={`h-8 text-sm px-2 text-right ${!habilitado ? "bg-muted/60 opacity-70 cursor-not-allowed" : ""}`}
                          {...field}
                          disabled={!habilitado}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          onFocus={(e) => setTimeout(() => e.target.select(), 0)}
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

      <Separator />

      <div style={gridStyle} className="grid font-bold text-sm">
        <div className="col-span-2 uppercase">total votos por agrupaciones políticas</div>
        {categorias.map((cat) => (
          <div key={cat.id} className="text-right mr-4">{totales[cat.id] ?? 0}</div>
        ))}
      </div>
    </div>
  );
}
