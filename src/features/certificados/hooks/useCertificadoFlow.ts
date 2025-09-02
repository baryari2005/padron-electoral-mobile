// src/features/certificados/hooks/useCertificadoFlow.ts
"use client";

import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  certificadoSchema,
  type CertificadoFormData,
} from "@/features/certificados/utils/schema/schema";
import { STEPS, STEP_FIELDS } from "@/features/certificados/utils/steps";
import { toApiPayload } from "@/features/certificados/utils/payload";

import { useCategorias } from "@/features/certificados/hooks/useCategorias";
import { useAgrupaciones } from "@/features/certificados/hooks/useAgrupaciones";
import { usePermisosMatriz } from "@/features/certificados/hooks/usePermisosMatriz";
import { useCertificadoDefaults } from "@/features/certificados/hooks/useCertificadoDefaults";

import type { EstablecimientoConCircuito } from "@/features/certificados/types/types";

export function useCertificadoFlow() {
  const form = useForm<CertificadoFormData>({
    resolver: zodResolver(certificadoSchema),
    mode: "onChange",
    defaultValues: {
      mesa: { escuelaId: "", numeroMesa: "", circuitoId: "" },
      votosEspeciales: {},
      totales: { sobres: 0, votantes: 0, diferencia: 0 },
      resultadosPresidenciales: [],
    },
  });

  const { categorias, loadingCategorias } = useCategorias();
  const { agrupaciones, loadingAgrupaciones } = useAgrupaciones();
  const { habilitadosPorAgrupacion, loadingPermisos } = usePermisosMatriz({
    ready: !loadingAgrupaciones,
  });

  const [escuelaSel, setEscuelaSel] = useState<EstablecimientoConCircuito | null>(null);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [saving, setSaving] = useState(false);

  const isLast = step === STEPS.length - 1;
  const canBack = step > 0;
  const isLoading = loadingCategorias || loadingAgrupaciones;

  // defaults de resultados cuando corresponde
  useCertificadoDefaults(form, "crear", agrupaciones, categorias, step >= 1);

  // inconsistencias
  const sobres = form.watch("totales.sobres");
  const votosEspeciales = form.watch("votosEspeciales");
  const resultadosPresidenciales = form.watch("resultadosPresidenciales");
  const hayInconsistencias = useMemo(() => {
    if (!categorias?.length) return false;
    return categorias.some((cat) => {
      const esp = Object.values((votosEspeciales as any)?.[cat.id] || {}).reduce(
        (acc: number, val: any) => acc + (Number(val) || 0),
        0
      );
      const pres = (resultadosPresidenciales as any[])?.reduce(
        (acc: number, curr: any) => acc + (Number(curr?.[cat.id]) || 0),
        0
      );
      return esp + pres !== Number(sobres || 0);
    });
  }, [categorias, votosEspeciales, resultadosPresidenciales, sobres]);

  const next = async () => {
    const fields = STEP_FIELDS[step] ?? [];
    if (fields.length) {
      const ok = await form.trigger(fields, { shouldFocus: true });
      if (!ok) return;
    }
    setStep((s) => (s === 0 ? 1 : s === 1 ? 2 : 3));
  };

  const back = () => setStep((s) => (s === 3 ? 2 : s === 2 ? 1 : 0));

  const handleSave = useCallback(
    async (values: CertificadoFormData) => {
      try {
        setSaving(true);
        const payload = toApiPayload(values, categorias ?? []);
        const res = await fetch("/api/scrutiny-certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store",
        });

        let data: any = null;
        try { data = await res.json(); } catch {}

        if (!res.ok) {
          const err = data?.error ?? data;
          let msg = `Error ${res.status}`;
          if (typeof err === "string") msg = err;
          else if (Array.isArray(err)) msg = err.map((i: any) => i?.message || JSON.stringify(i)).join("\n");
          else if (err && typeof err === "object") {
            const issues = (err as any).issues;
            msg = Array.isArray(issues)
              ? issues.map((i: any) => `${(i.path || []).join(".")}: ${i.message}`).join("\n")
              : JSON.stringify(err);
          }
          throw new Error(msg);
        }

        toast.success("Certificado guardado con éxito.");
        form.reset();
        setEscuelaSel(null);
        setStep(0);
      } catch (e: any) {
        toast.error(e?.message ?? "Error al guardar el certificado.");
        console.error(e);
      } finally {
        setSaving(false);
      }
    },
    [categorias, form]
  );

  // helpers UI
  const fechaEs = useMemo(
    () => new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date()),
    []
  );
  const seccionValor = useMemo(() => {
    const s: any = (escuelaSel as any)?.circuito?.seccion || (escuelaSel as any)?.seccion;
    const codigo = s?.codigo ?? s?.numero ?? s?.id;
    const nombre = s?.nombre ?? "San Miguel 2025";
    return codigo ? `${codigo} - ${nombre}` : "53 - San Miguel 2025";
  }, [escuelaSel]);
  const circuitoValor = useMemo(() => {
    const c: any = (escuelaSel as any)?.circuito;
    return c?.nombre ?? c?.codigo ?? c?.numero ?? "-";
  }, [escuelaSel]);
  const mesaValor = form.watch("mesa.numeroMesa") || "-";

  // bloquear submits no deseados en pasos intermedios
  const blockEnterIfNotLast: React.KeyboardEventHandler<HTMLFormElement> = (e) => {
    if (!isLast && (e.key === "Enter" || e.key === "NumpadEnter")) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const preventSubmitWhenNotLast: React.FormEventHandler<HTMLFormElement> = (e) => {
    if (!isLast) { e.preventDefault(); e.stopPropagation(); }
  };
  const killAccidentalSubmitButton: React.MouseEventHandler<HTMLFormElement> = (e) => {
    if (isLast) return;
    const el = (e.target as HTMLElement)?.closest("button");
    if (el && (el as HTMLButtonElement).type === "submit") {
      e.preventDefault(); e.stopPropagation();
    }
  };

  return {
    // data/ui
    form, step, setStep, isLast, canBack, saving, isLoading,
    categorias, agrupaciones, habilitadosPorAgrupacion, loadingPermisos,
    hayInconsistencias,
    escuelaSel, setEscuelaSel,
    fechaEs, seccionValor, circuitoValor, mesaValor,
    // actions
    next, back, handleSave,
    // handlers para el <form>
    blockEnterIfNotLast, preventSubmitWhenNotLast, killAccidentalSubmitButton,
    // constantes
    STEPS,
  };
}
