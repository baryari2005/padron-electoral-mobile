// src/features/certificados/wizard/hooks/useResultadosInit.ts
"use client";
import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { CertificadoFormData } from "../../utils/schema/schema";

type Categoria = { id: string };
type Agrupacion = {
  id: number;
  nombre?: string;
  numero?: number | string;
  profileImage?: string | null;
};

/**
 * Crea/reconcilia las filas de resultados cuando entrás al Paso 1 y están las
 * categorías + agrupaciones listas. Garantiza:
 *  - agrupacionId presente
 *  - cada catId numérica inicializada en 0
 */
export function useResultadosInit(
  form: UseFormReturn<CertificadoFormData>,
  step: number,
  categorias: Categoria[],
  agrupaciones: Agrupacion[],
  ready: boolean
) {
  useEffect(() => {
    if (!ready || step !== 1) return;

    const current = form.getValues("resultadosPresidenciales") ?? [];
    const byId = new Map<number, any>(
      (current as any[]).map((r) => [Number(r?.agrupacionId), r])
    );

    const next = agrupaciones.map((ag) => {
      const prev = byId.get(ag.id) ?? {};
      const row: any = {
        agrupacionId: ag.id,                    // ← requerido por el schema y por toApiPayload
        nombre: ag.nombre ?? "",
        numero: ag.numero ?? "",
        profileImage: ag.profileImage ?? null,
      };
      for (const c of categorias) {
        const v = prev[c.id];
        row[c.id] = Number.isFinite(Number(v)) ? Number(v) : 0; // siempre número
      }
      return row;
    });

    form.setValue("resultadosPresidenciales", next, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [ready, step, categorias, agrupaciones, form]);
}
