// src/features/certificados/hooks/useCertificadoDefaults.ts
"use client";
import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";

type Categoria  = { id: string; nombre: string };
type Agrupacion = { id: number; nombre: string; numero?: number | string; profileImage?: string | null };

export function useCertificadoDefaults(
  form: UseFormReturn<any>,
  modo: "crear" | "editar",
  agrupaciones: Agrupacion[],
  categorias: Categoria[],
  enabled = true
) {
  const { setValue, getValues } = form;

  useEffect(() => {
    if (!enabled) return;
    if (modo !== "crear") return;
    if (!agrupaciones?.length || !categorias?.length) return;

    console.log("AGRUPACIONES", agrupaciones);

    const actuales = getValues("resultadosPresidenciales");
    if (Array.isArray(actuales) && actuales.length > 0) return;

    // ✅ UNA FILA POR AGRUPACIÓN (no por categoría)
    const rows = agrupaciones.map((a) => ({
      agrupacionId: a.id,
      numero: a.numero ?? "",
      nombre: a.nombre ?? "",
      profileImage: a.profileImage ?? null,
      // columnas por categoría en 0
      ...Object.fromEntries(categorias.map((c) => [c.id, 0])),
    }));

    console.log("VERRRR", rows);
    setValue("resultadosPresidenciales", rows, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [enabled, modo, agrupaciones, categorias, setValue, getValues]);
}
