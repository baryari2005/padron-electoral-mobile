// app/(mobile)/certificados/nuevo/page.tsx
"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

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
import CertificateHeader from "@/features/certificados/components/CertificateHeader";
import type { EstablecimientoConCircuito } from "@/features/certificados/types/types";

import { useCategorias } from "@/features/certificados/hooks/useCategorias";
import { useAgrupaciones } from "@/features/certificados/hooks/useAgrupaciones";
import { usePermisosMatriz } from "@/features/certificados/hooks/usePermisosMatriz";
import { useCertificadoDefaults } from "@/features/certificados/hooks/useCertificadoDefaults";
import { CommonLoader } from "../common/CommonLoader";
import MobileStepHeader from "@/features/certificados/components/MobileStepHeader";
import { ErrorsCertificateSummary } from "@/features/certificados/components/ErrorsCertificateSummary";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth";

// 👉 4 pasos (dos separados para Agrupaciones / Especiales)
const STEPS = [
  "Mesa y Totales",
  "Votos por Agrupaciones",
  "Votos especiales",
  "Resumen y Guardado",
] as const;

const STEP_FIELDS: Record<number, FieldPath<CertificadoFormData>[]> = {
  0: ["mesa.escuelaId", "mesa.numeroMesa", "totales.sobres", "totales.votantes"],
  1: [],
  2: [],
};

// --- helpers numéricos ---
const toNum = (n: any) => (Number.isFinite(Number(n)) ? Number(n) : 0);

// 🔧 MANDAR NUMÉRICOS AL API (evita strings en IDs numéricos)
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

const fechaEs = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
}).format(new Date());

export default function NuevaCargaMobilePage() {
  const router = useRouter();                           // 👈
  const token = useAuth((s) => s.token);                // 👈 sesión en memoria

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

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const isLast = step === STEPS.length - 1;
  const canBack = step > 0;
  const [saving, setSaving] = useState(false);

  // escuela seleccionada (para chips del header)
  const [escuelaSel, setEscuelaSel] = useState<EstablecimientoConCircuito | null>(null);

  // Defaults de resultados cuando corresponde
  useCertificadoDefaults(form, "crear", agrupaciones, categorias, step >= 1);

  // Inconsistencias resumen
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

  const handleSave = useCallback(
    async (values: CertificadoFormData) => {
      try {
        const token = useAuth.getState().token
        if (!token) {
          toast.error("Tu sesión no está activa. Iniciá sesión para guardar.");
          router.replace("/login");
          return;
        }

        setSaving(true);
        const payload = toApiPayload(values, categorias ?? []);
        const res = await fetch("/api/scrutiny-certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json",  Authorization: `Bearer ${token}`,   },
          body: JSON.stringify(payload),
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const err = data?.error ?? data;
          let msg = `Error ${res.status}`;
          if (typeof err === "string") msg = err;
          else if (Array.isArray(err)) msg = err.map((i: any) => i?.message || JSON.stringify(i)).join("\n");
          else if (err?.issues) msg = err.issues.map((i: any) => `${(i.path || []).join(".")}: ${i.message}`).join("\n");
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
    [categorias, form, token, router]
  );

  // navegación
  const next = async () => {
    const fields = STEP_FIELDS[step] ?? [];
    if (fields.length) {
      const ok = await form.trigger(fields, { shouldFocus: true });
      if (!ok) return;
    }
    setStep((s) => (s < (STEPS.length - 1) ? ((s + 1) as typeof s) : s));
  };
  const back = () => setStep((s) => (s > 0 ? ((s - 1) as typeof s) : s));

  const isLoading = loadingCategorias || loadingAgrupaciones;

  // datos para header
  const circuitoValor = useMemo(() => {
    const c: any = (escuelaSel as any)?.circuito;
    return c?.nombre ?? c?.codigo ?? c?.numero ?? "-";
  }, [escuelaSel]);
  const mesaValor = form.watch("mesa.numeroMesa") || "-";

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={(e) => { if (!isLast) { e.preventDefault(); e.stopPropagation(); } }}
        onKeyDown={(e) => { if (!isLast && (e.key === "Enter" || e.key === "NumpadEnter")) { e.preventDefault(); e.stopPropagation(); } }}
        className="min-h-[100dvh] flex flex-col"
      >
        {/* ⛳️ Encabezado SIEMPRE visible en todos los pasos */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur">
          <MobileStepHeader
            step={step}
            steps={STEPS}
            escuela={escuelaSel?.nombre ?? null}
            circuito={String(circuitoValor || "-")}
            mesa={String(mesaValor || "-")}
            loadingText={isLoading ? "Cargando…" : undefined}
            avatarColor="emerald"
          />
          <Separator />
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {isLoading ? (
            <CommonLoader
              logo="/logo.png"
              alternativeLogo="/logo-white.png"
              alternativeText="Más San Miguel"
              title="Votaciones 2025"
              subTitle="San Miguel"
              loaderText="Cargando certificado de escrutinio ..."
            />
          ) : (
            <>
              {step === 0 && (
                <section className="space-y-4">
                  <CertificateHeader
                    fecha={fechaEs}
                    seccionValor={(() => {
                      const s: any = (escuelaSel as any)?.circuito?.seccion || (escuelaSel as any)?.seccion;
                      const codigo = s?.codigo ?? s?.numero ?? s?.id;
                      const nombre = s?.nombre ?? "SAN MIGUEL";
                      return codigo ? `${codigo} - ${nombre}` : "53 - SAN MIGUEL";
                    })()}
                    circuitoValor={String(circuitoValor || "-")}
                    mesaValor={String(mesaValor || "-")}
                  />
                  <MesaSelector
                    control={form.control}
                    setValue={form.setValue}
                    disabled={false}
                    onEscuelaSeleccionada={setEscuelaSel}
                  />
                  <Separator />
                  <TotalesForm control={form.control} setValue={form.setValue} />
                </section>
              )}

              {/* Paso 2: SOLO Agrupaciones */}
              {step === 1 && (
                <section className="space-y-4 -mx-4 px-4 overflow-x-auto">
                  <CertificadoHeaderSummary />
                  <ResultadosPresidencialesForm
                    control={form.control}
                    resultadosPresidenciales={form.getValues().resultadosPresidenciales}
                    categorias={categorias}
                    agrupaciones={agrupaciones}
                    habilitadosPorAgrupacion={habilitadosPorAgrupacion}
                    loadingPermisos={loadingPermisos}
                  />
                </section>
              )}

              {/* Paso 3: SOLO Especiales */}
              {step === 2 && (
                <section className="space-y-4 -mx-4 px-4 overflow-x-auto">
                  <CertificadoHeaderSummary />
                  <VotosEspecialesForm control={form.control} categorias={categorias} />
                </section>
              )}

              {/* Paso 4: Resumen */}
              {step === 3 && (
                <section className="space-y-4 -mx-4 px-4 overflow-x-auto">
                  <ResumenValidacionTotalesPorColumna control={form.control} categorias={categorias} />

                  {hayInconsistencias && (
                    <ErrorsCertificateSummary errores={"Hay diferencias entre sobres y los totales por columna."} />
                  )}
                </section>
              )}
            </>
          )}
        </main>

        <Separator className="mb-2" />
        <footer
          className="sticky bottom-0 bg-background/90 backdrop-blur px-4 py-3"
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
              <Button type="button" className="flex-1" onClick={next} disabled={saving}>
                Siguiente
              </Button>
            )}
          </div>
        </footer>
      </form>
    </Form>
  );
}
