// src/features/certificados/wizard/hooks/useDiferenciaInconsistencia.ts
import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { CertificadoFormData } from "@/features/certificados/utils/schema/schema";

export function useDiferenciaInconsistencia(form: UseFormReturn<CertificadoFormData>) {
  const diferenciaRaw = form.watch("totales.diferencia");
  const hayInconsistencias = useMemo(() => {
    const d = Number(diferenciaRaw ?? 0);
    return Number.isFinite(d) && d !== 0;
  }, [diferenciaRaw]);

  const mensajes = hayInconsistencias ? "Hay diferencias entre votantes y sobres en urna." : "";

  return { hayInconsistencias, mensajes };
}
