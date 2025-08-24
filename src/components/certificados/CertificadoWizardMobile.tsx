// app/(mobile)/certificados/nuevo/page.tsx
"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import type { FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  certificadoSchema,
  type CertificadoFormData,
} from "@/features/certificados/utils/schema/schema";

import { MesaSelector } from "@/features/certificados/components/MesaSelector";
import { TotalesForm } from "@/features/certificados/components/TotalesForm";
import { CertificadoHeaderSummary } from "@/features/certificados/components/CertificadoHeaderSummary";
import { ResultadosPresidencialesForm } from "@/features/certificados/components/ResultadosPresidencialesForm";
import { VotosEspecialesForm } from "@/features/certificados/components/VotosEspecialesForm";
import { ResumenValidacionTotalesPorColumna } from "@/features/certificados/components/ResumenValidacionTotalesPorColumna";

import { useCategorias } from "@/features/certificados/hooks/useCategorias";
import { useAgrupaciones } from "@/features/certificados/hooks/useAgrupaciones";
import { usePermisosMatriz } from "@/features/certificados/hooks/usePermisosMatriz";
import { useCertificadoDefaults } from "@/features/certificados/hooks/useCertificadoDefaults";
import { toast } from "sonner";

const STEPS = ["Mesa y Totales", "Resultados y Especiales", "Resumen y Guardado"] as const;

const STEP_FIELDS: Record<number, FieldPath<CertificadoFormData>[]> = {
  0: ["mesa.escuelaId", "mesa.numeroMesa", "totales.sobres", "totales.votantes"],
  1: [],
  2: [],
};

// helpers payload
const toNum = (n: any) => (Number.isFinite(Number(n)) ? Number(n) : 0);
function toApiPayload(values: CertificadoFormData, categorias: { id: string }[]) {
  const votosEspeciales: Record<string, any> = {};
  for (const [catId, obj] of Object.entries(values.votosEspeciales || {})) {
    const o = obj as any;
    votosEspeciales[String(catId)] = {
      nulos: toNum(o?.nulos),
      recurridos: toNum(o?.recurridos),
      impugnados: toNum(o?.impugnados),
      comandoElectoral: toNum(o?.comandoElectoral),
      blancos: toNum(o?.blancos),
    };
  }

  const resultados: Array<{ categoria: string; agrupacionId: string; votos: number }> = [];
  for (const row of values.resultadosPresidenciales || []) {
    const agrupacionId = String((row as any)?.agrupacionId ?? "");
    for (const cat of categorias) {
      resultados.push({ categoria: String(cat.id), agrupacionId, votos: toNum((row as any)?.[cat.id]) });
    }
  }

  return {
    establecimientoId: String(values.mesa.escuelaId ?? ""),
    numeroMesa: toNum(values.mesa.numeroMesa),
    circuitoId:
      values.mesa.circuitoId !== undefined && values.mesa.circuitoId !== null
        ? toNum(values.mesa.circuitoId)
        : undefined,
    totales: {
      sobres: toNum(values.totales.sobres),
      votantes: toNum(values.totales.votantes),
      diferencia: toNum(values.totales.diferencia),
    },
    votosEspeciales,
    resultados,
  };
}

export default function NuevaCargaMobilePage() {
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

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [saving, setSaving] = useState(false); // ← estado local, no usamos isSubmitting
  const isLast = step === (STEPS.length - 1);
  const canBack = step > 0;

  // Inicializar filas en paso de resultados
  useCertificadoDefaults(form, "crear", agrupaciones, categorias, step >= 1);

  // Inconsistencias
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

  // Guardar solo manualmente
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

  // Bloquear Enter/NumpadEnter si no es el último paso
  const blockEnterIfNotLast: React.KeyboardEventHandler<HTMLFormElement> = (e) => {
    if (!isLast && (e.key === "Enter" || e.key === "NumpadEnter")) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Frenar CUALQUIER submit nativo en pasos 0/1 (por botones hijos sin type, etc.)
  const preventSubmitWhenNotLast: React.FormEventHandler<HTMLFormElement> = (e) => {
    if (!isLast) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Extra: por si algún hijo trae <button type="submit">, lo cazamos antes
  const killAccidentalSubmitButton: React.MouseEventHandler<HTMLFormElement> = (e) => {
    if (isLast) return;
    const el = (e.target as HTMLElement)?.closest("button");
    if (el && (el as HTMLButtonElement).type === "submit") {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const next = async () => {
    const fields = STEP_FIELDS[step] ?? [];
    if (fields.length) {
      const ok = await form.trigger(fields, { shouldFocus: true });
      if (!ok) return;
    }
    setStep((s) => (s === 0 ? 1 : 2));
  };

  const back = () => setStep((s) => (s === 2 ? 1 : 0));

  const isLoading = loadingCategorias || loadingAgrupaciones;

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={preventSubmitWhenNotLast}
        onSubmitCapture={preventSubmitWhenNotLast}
        onClickCapture={killAccidentalSubmitButton}
        onKeyDown={blockEnterIfNotLast}
        className="min-h-[100dvh] flex flex-col"
      >
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b">
          <div className="px-4 py-3 space-y-1">
            <p className="text-[11px] text-muted-foreground">Paso {step + 1} / {STEPS.length}</p>
            <h1 className="text-lg font-semibold">{STEPS[step]}</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <>
              {step === 0 && (
                <section className="space-y-4">
                  <MesaSelector control={form.control} setValue={form.setValue} disabled={false} />
                  <Separator />
                  <TotalesForm control={form.control} setValue={form.setValue} />
                </section>
              )}

              {step === 1 && (
                <section className="space-y-4">
                  <CertificadoHeaderSummary />
                  <div className="-mx-4 px-4 overflow-x-auto">
                    <ResultadosPresidencialesForm
                      control={form.control}
                      resultadosPresidenciales={form.getValues().resultadosPresidenciales}
                      categorias={categorias}
                      agrupaciones={agrupaciones}
                      habilitadosPorAgrupacion={habilitadosPorAgrupacion}
                      loadingPermisos={loadingPermisos}
                    />
                  </div>
                  <Separator />
                  <div className="-mx-4 px-4 overflow-x-auto">
                    <VotosEspecialesForm control={form.control} categorias={categorias} />
                  </div>
                </section>
              )}

              {step === 2 && (
                <section className="space-y-4">
                  <div className="-mx-4 px-4 overflow-x-auto">
                    <ResumenValidacionTotalesPorColumna control={form.control} categorias={categorias} />
                  </div>
                  {hayInconsistencias && (
                    <p className="text-sm text-red-600 font-medium">
                      Hay diferencias entre sobres y los totales por columna.
                    </p>
                  )}
                </section>
              )}
            </>
          )}
        </main>

        <footer
          className="sticky bottom-0 bg-background/90 backdrop-blur border-t px-4 py-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
        >
          <div className="flex gap-2">
            {canBack && (
              <Button type="button" variant="outline" className="flex-1" onClick={back}>
                Atrás
              </Button>
            )}
            {isLast ? (
              <Button
                type="button"
                className="flex-1"
                onClick={form.handleSubmit(handleSave)}
                disabled={saving}
              >
                {saving ? "Guardando…" : "Guardar"}
              </Button>
            ) : (
              <Button
                type="button"
                className="flex-1"
                onClick={next}
                disabled={saving}
              >
                Siguiente
              </Button>
            )}
          </div>
        </footer>
      </form>
    </Form>
  );
}
