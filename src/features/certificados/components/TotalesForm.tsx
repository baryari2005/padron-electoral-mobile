"use client";

import { UseFormReturn, useWatch } from "react-hook-form";
import { CertificadoFormData } from "../utils/schema/schema";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { FormItemNumberAndLyrics } from "./FormItemNumberAndLyrics";


interface TotalesFormProps {
  control: UseFormReturn<CertificadoFormData>["control"];
  setValue: UseFormReturn<CertificadoFormData>["setValue"];
}

export function TotalesForm({ control, setValue }: TotalesFormProps) {
  const sobres = useWatch({ control, name: "totales.sobres" }) ?? 0;
  const votantes = useWatch({ control, name: "totales.votantes" }) ?? 0;

  useEffect(() => {
    const e = Number(votantes ?? 0);
    const s = Number(sobres ?? 0);
    const diff = (Number.isFinite(e) ? e : 0) - (Number.isFinite(s) ? s : 0);

    setValue("totales.diferencia", diff, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [sobres, votantes, setValue]);

  const campos = [
    { name: "votantes", label: "CANTIDAD DE ELECTORES QUE HAN VOTADO" },
    { name: "sobres", label: "CANTIDAD DE SOBRES EN LA URNA" },
    { name: "diferencia", label: "DIFERENCIA" },
  ] as const;

  return (
    <section className="bg-card border border-border rounded-2xl shadow-sm p-4 md:p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campos.map(({ name, label }) => (
          <div key={name}>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              {label}
            </div>
            <FormItemNumberAndLyrics
              control={control}
              name={`totales.${name}`}
              label=""                       // ya mostramos el label arriba
              disabled={name === "diferencia"}
              showErrorCondition={(n, v) => n === "totales.diferencia" && v !== 0}
              errorMessage={
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1 font-semibold">
                  <TriangleAlert className="w-4 h-4" />
                  Hay diferencia entre sobres y votantes
                </div>
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}

