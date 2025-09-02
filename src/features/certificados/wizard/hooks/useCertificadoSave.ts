// src/features/certificados/wizard/hooks/useCertificadoSave.ts
"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import type { CertificadoFormData } from "@/features/certificados/utils/schema/schema";
import type { EstablecimientoConCircuito } from "@/features/certificados/types/types";
import { toApiPayload } from "../utils/payload";

type Categoria = { id: string };

export function useCertificadoSave(
  form: UseFormReturn<CertificadoFormData>,
  categorias: Categoria[] | undefined,
  escuelaSel: EstablecimientoConCircuito | null,
  escuela: EstablecimientoConCircuito | null
) {
  const [saving, setSaving] = useState(false);
  const [saveSummary, setSaveSummary] = useState<null | {
    escuela: string;
    circuito?: string | number;
    mesa: string | number;
  }>(null);

  const handleSave = useCallback(
    async (values: CertificadoFormData) => {
      try {
        setSaving(true);
        const payload = toApiPayload(values, categorias ?? []);

        // resumen ANTES
        const resumen = {
          escuela: escuelaSel?.nombre ?? (escuela?.nombre ?? "—"),
          circuito:
            (escuelaSel as any)?.circuito?.nombre ??
            (escuelaSel as any)?.circuito?.codigo ??
            (escuelaSel as any)?.circuito?.numero ??
            undefined,
          mesa: payload.numeroMesa,
        };

        const res = await fetch("/api/scrutiny-certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store",
        });

        const text = await res.text().catch(() => "");
        let data: any = null;
        try { data = text ? JSON.parse(text) : null; } catch { data = text; }

        if (!res.ok) {
          const err = data?.error ?? data;
          let msg = `Error ${res.status}`;
          if (typeof err === "string") msg = err;
          else if (Array.isArray(err)) msg = err.map((i: any) => i?.message || JSON.stringify(i)).join("\n");
          else if (err?.issues) msg = err.issues.map((i: any) => `${(i.path || []).join(".")}: ${i.message}`).join("\n");
          throw new Error(msg);
        }

        toast.success("Certificado guardado con éxito.");
        setSaveSummary(resumen);
        form.reset();
      } catch (e: any) {
        console.error("[save] error:", e);
        toast.error(e?.message ?? "Error al guardar el certificado.");
      } finally {
        setSaving(false);
      }
    },
    [categorias, form, escuela, escuelaSel]
  );

  const resetAfterSuccess = () => {
    setSaveSummary(null);
  };

  return { saving, saveSummary, setSaveSummary, handleSave, resetAfterSuccess };
}
