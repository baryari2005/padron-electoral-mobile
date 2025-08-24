"use client";

import { Control, useWatch, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { CertificadoFormData } from "../utils/schema/schema";
import { useEffect, useMemo } from "react";

interface Categoria {
  id: string;
  nombre: string;
}

const votoEspecialKeys = [
  "nulos",
  "recurridos",
  "impugnados",
  "comandoElectoral",
  "blancos",
] as const;

type VotoEspecialKey = typeof votoEspecialKeys[number];

const items: { key: VotoEspecialKey; label: string; sub?: string }[] = [
  { key: "nulos", label: "VOTOS NULOS" },
  { key: "recurridos", label: "VOTOS RECURRIDOS", sub: "QUE SE REMITEN EN SOBRE Nro.3" },
  { key: "impugnados", label: "VOTOS DE IDENTIDAD IMPUGNADA", sub: "QUE SE REMITEN EN SOBRE Nro.3" },
  { key: "comandoElectoral", label: "VOTOS DEL COMANDO ELECTORAL", sub: "QUE SE REMITEN EN EL BOLSIN" },
  { key: "blancos", label: "VOTOS EN BLANCO" }, // ← calculado
];

const norm = (s: string) => (s ?? "").trim().toUpperCase();
const toN = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

interface VotosEspecialesFormProps {
  control: Control<CertificadoFormData>;
  categorias: Categoria[];
}

export function VotosEspecialesForm({ control, categorias }: VotosEspecialesFormProps) {
  const { setValue, getValues } = useFormContext<CertificadoFormData>();

  // 👇 Paths válidos según tu schema
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
          setValue(path, 0);
        }
      });
    });
  }, [categorias, getValues, setValue]);

  // Mapas útiles
  const catNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categorias) m.set(c.id, c.nombre);
    return m;
  }, [categorias]); // typo fix below

  // 🛠️ FIX: correct dependency name
  // (If you copy-paste, ensure it's [categorias] not [categororias])
  // I’ll keep using [categorias] below.

  // —— TOTAL POR AGRUPACIONES, agrupado por ID de categoría ——
  // Soportamos varias formas:
  //   A) Por fila de agrupación: row.votos[cat.id] o row.votosPorCategoria[cat.id]
  //   B) Por fila de agrupación: row.votos["SENADORES PROV."] (por nombre)
  //   C) Por fila "por categoría": row.categoria + row.votos | row.total | row.totalVotos
  const totalAgrPorCatId = useMemo(() => {
    const acc: Record<string, number> = {};
    const arr = (resultadosPresidenciales as any[]) ?? [];

    for (const cat of categorias) {
      const id = cat.id;
      const name = norm(cat.nombre);
      let sum = 0;

      for (const row of arr) {
        // A) Objeto votos keyeado por ID
        if (row?.votos && row.votos[id] != null) {
          sum += toN(row.votos[id]);
          continue;
        }
        if (row?.votosPorCategoria && row.votosPorCategoria[id] != null) {
          sum += toN(row.votosPorCategoria[id]);
          continue;
        }
        // B) Objeto votos keyeado por NOMBRE
        if (row?.votos && row.votos[name] != null) {
          sum += toN(row.votos[name]);
          continue;
        }
        // C) Filas por categoría
        const catRowName = norm(row?.categoria ?? row?.categoriaNombre ?? "");
        if (catRowName && catRowName === name) {
          sum += toN(row?.votos ?? row?.total ?? row?.totalVotos);
          continue;
        }
        // D) Campo plano por ID (menos común, pero por las dudas)
        if (row && row[id] != null && typeof row[id] !== "object") {
          sum += toN(row[id]);
          continue;
        }
      }

      acc[id] = sum;
    }

    return acc;
  }, [resultadosPresidenciales, categorias]);

  // 🧮 Recalcular "blancos" por categoría cuando cambie algo relevante
  useEffect(() => {
    const totalSobres = toN(sobres);

    for (const cat of categorias) {
      const espCat = (especiales as any)?.[cat.id] ?? {};

      const sumaEspecialesSinBlancos =
        toN(espCat.nulos) +
        toN(espCat.recurridos) +
        toN(espCat.impugnados) +
        toN(espCat.comandoElectoral);

      const totalAgr = totalAgrPorCatId[cat.id] ?? 0;

      let blancos = totalSobres - (totalAgr + sumaEspecialesSinBlancos);
      if (blancos < 0) blancos = 0; // clamp a 0

      const path = `votosEspeciales.${cat.id}.blancos` as const;
      if (toN(getValues(path)) !== blancos) {
        setValue(path, blancos, { shouldValidate: true, shouldDirty: false });
      }
    }
  }, [sobres, especiales, totalAgrPorCatId, categorias, setValue, getValues]);

  const gridStyle = {
    gridTemplateColumns: `1fr repeat(${categorias.length}, 100px)`,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div style={gridStyle} className="grid text-xs font-semibold items-center px-2">
        <div className="pl-2">CONCEPTO</div>
        {categorias.map((cat) => (
          <div key={cat.id} className="text-center">{cat.nombre}</div>
        ))}
      </div>

      <Separator />

      {/* Rows */}
      {items.map((item) => (
        <div
          key={item.key}
          style={gridStyle}
          className="grid items-center text-sm gap-2 px-2 py-1 even:bg-muted/50 rounded"
        >
          <div className="pl-2">
            <div className="font-medium">{item.label}</div>
            {item.sub && <div className="text-xs text-muted-foreground">{item.sub}</div>}
          </div>

          {categorias.map((cat) => (
            <FormField
              key={cat.id}
              name={`votosEspeciales.${cat.id}.${item.key}` as const}
              control={control}
              render={({ field }) => {
                const isBlancos = item.key === "blancos";
                return (
                  <FormItem className="flex justify-center">
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        className={`h-8 text-sm px-2 text-right ${isBlancos ? "bg-muted/60" : ""}`}
                        {...field}
                        value={field.value ?? 0}
                        readOnly={isBlancos}
                        tabIndex={isBlancos ? -1 : 0}
                        onChange={
                          isBlancos
                            ? undefined
                            : (e) => field.onChange(Number(e.target.value))
                        }
                        onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                        aria-readonly={isBlancos}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
