// src/features/certificados/wizard/CertificadoWizardMobile.tsx
"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CommonLoader } from "@/components/common/CommonLoader";

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

import MobileStepHeader from "@/features/certificados/components/MobileStepHeader";
import { ErrorsCertificateSummary } from "@/features/certificados/components/ErrorsCertificateSummary";

import type { EstablecimientoConCircuito } from "@/features/certificados/types/types";
import { useCategorias } from "@/features/certificados/hooks/useCategorias";
import { useAgrupaciones } from "@/features/certificados/hooks/useAgrupaciones";
import { usePermisosMatriz } from "@/features/certificados/hooks/usePermisosMatriz";

import { useAuth } from "@/stores/auth";

import { STEPS, STEP_FIELDS } from "./constants";
import { useWizardSteps } from "./hooks/useWizardSteps";
import { useDiferenciaInconsistencia } from "./hooks/useDiferenciaInconsistencia";
import { useCertificadoSave } from "./hooks/useCertificadoSave";
import { getDefaultEscuelaFromUser } from "./utils/getDefaultEscuela";
import { useResultadosInit } from "./hooks/useResultadosInit";
import { Loader2 } from "lucide-react";
import { useInconsistenciasPorColumna } from "./hooks/useInconsistenciasPorColumna";
import { EscuelaCompletadaScreen } from "./components/EscuelaCompletadaScreen";

const fechaEs = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
}).format(new Date());

export default function CertificadoWizardMobile() {
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  const hasHydrated = useAuth((s) => s.hasHydrated);
  const fetchUser = useAuth((s) => s.fetchUser);

  const [sinMesasInfo, setSinMesasInfo] = useState({
    sinMesas: false,
    establecimiento: null as EstablecimientoConCircuito | null,
  });

  const noHayMesas = sinMesasInfo.sinMesas && !!sinMesasInfo.establecimiento;

  const handleSinMesasChange = useCallback((info: {
    sinMesas: boolean;
    establecimiento: EstablecimientoConCircuito | null;
  }) => {
    setSinMesasInfo(info);
  }, []);

  useEffect(() => {
    try {
      if (!localStorage.getItem("auth-store-migrated-v2")) {
        localStorage.removeItem("auth-store");
        localStorage.removeItem("token");
        localStorage.setItem("auth-store-migrated-v2", "1");
      }
    } catch { }
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user && token) fetchUser();
  }, [hasHydrated, token, user, fetchUser]);

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

  const categoriasReady = !!categorias?.length && !loadingCategorias;
  const agrupacionesReady = !!agrupaciones?.length && !loadingAgrupaciones;
  const permisosReady = !loadingPermisos;
  const step1Ready = categoriasReady && agrupacionesReady && permisosReady;

  // Steps
  const { step, setStep, next, back, isLast, canBack } = useWizardSteps(form, STEP_FIELDS);
  const disabledNext = (step === 0 && !step1Ready);

  // 👉 NUEVO: inicializa/reconcilia las filas del paso 1
  useResultadosInit(form, step, categorias, agrupaciones, step1Ready);


  // Selección de escuela para header
  const [escuelaSel, setEscuelaSel] = useState<EstablecimientoConCircuito | null>(null);
  const [escuela, setEscuela] = useState<EstablecimientoConCircuito | null>(null);

  // Escuela por defecto desde user
  const defaultEscuela = useMemo(() => getDefaultEscuelaFromUser(user), [user]);
  useEffect(() => {
    if (defaultEscuela && (!escuela || escuela.id !== (defaultEscuela as any).id)) {
      setEscuela(defaultEscuela);
    }
  }, [defaultEscuela, escuela]);

  // Guardado + pantalla de éxito
  const { saving, saveSummary, resetAfterSuccess, handleSave } = useCertificadoSave(
    form,
    categorias,
    escuelaSel,
    escuela
  );

  // Inconsistencias por “diferencia”
  const { hayInconsistencias } = useDiferenciaInconsistencia(form);
  const { hayInconsistenciasColumna } = useInconsistenciasPorColumna(form.control, categorias);

  const [confirmOpen, setConfirmOpen] = useState(false);


  const hayInconsistenciasGlobal = hayInconsistencias || hayInconsistenciasColumna;
  const mensajes =
    [
      hayInconsistencias ? "Hay diferencias entre votantes y sobres en urna." : null,
      hayInconsistenciasColumna ? "Los totales por columna no coinciden con la cantidad de sobres." : null,
    ].filter(Boolean).join(" ");

  const onInvalid = (errors: any) => {
    console.log("[submit INVALID]", errors); // 👈 vas a ver el detalle por campo
    // si querés, mostrá un mensaje único
    // Podés tomar el primer error y decir en qué paso está, etc.
  };

  const onClickGuardar = async () => {
    if (hayInconsistenciasGlobal) setConfirmOpen(true);
    else {
      setConfirmOpen(false);
      await form.handleSubmit(handleSave, onInvalid)();

    }
  };
  const confirmarGuardarIgual = () => {
    setConfirmOpen(false);
    form.handleSubmit(handleSave)();
  };

  // Header data
  const circuitoValor = useMemo(() => {
    const c: any = (escuelaSel as any)?.circuito;
    return c?.nombre ?? c?.codigo ?? c?.numero ?? "-";
  }, [escuelaSel]);

  const mesaValor = form.watch("mesa.numeroMesa") || "-";

  // Pantalla de éxito
  if (saveSummary) {
    return (
      <Form {...form}>
        <div className="min-h-[100dvh]">
          {/* Import on demand to evitar otro import arriba */}
          {React.createElement(require("./components/SuccessScreen").SuccessScreen, {
            summary: saveSummary,
            onReset: () => {
              resetAfterSuccess();
              form.reset();
              setEscuelaSel(null);
              setStep(0);
            },
          })}
        </div>
      </Form>
    );
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSave, onInvalid)}
        onKeyDown={(e) => {
          if (!isLast && (e.key === "Enter" || e.key === "NumpadEnter")) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="min-h-[100dvh] flex flex-col"
      >
        {!noHayMesas && (
          <>
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur">
              <MobileStepHeader
                step={step}
                steps={STEPS}
                escuela={escuelaSel?.nombre ?? null}
                circuito={String(circuitoValor || "-")}
                mesa={String(mesaValor || "-")}
                loadingText={step === 1 && !step1Ready ? "Cargando agrupaciones…" : undefined}
                avatarColor="emerald"
              />
              <Separator />
            </header>
          </>
        )}
        {/* Header */}

        {/* Main */}
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {step === 0 && (
            <>
              {noHayMesas && sinMesasInfo.establecimiento ? (
                <EscuelaCompletadaScreen
                  escuela={sinMesasInfo.establecimiento}
                  puedeElegirOtra={!Boolean(defaultEscuela)}   // si la escuela está bloqueada no dejamos cambiar
                  onElegirOtraEscuela={() => {
                    setSinMesasInfo({ sinMesas: false, establecimiento: null });
                    setEscuelaSel(null);
                    setEscuela(null);
                    // limpiamos campos
                    form.setValue("mesa.escuelaId", "");
                    form.setValue("mesa.numeroMesa", "");
                    form.setValue("mesa.circuitoId", "");
                  }}
                  onVolver={() => {
                    // si está bloqueada, volvemos p.ej. al home, o reseteamos el wizard
                    setSinMesasInfo({ sinMesas: false, establecimiento: null });
                    setEscuelaSel(null);
                    setEscuela(null);
                    form.reset();
                  }}
                />
              ) : (
                <section className="space-y-4">
                  <CertificateHeader
                    fecha={fechaEs}
                    seccionValor={(() => {
                      const s: any = (escuelaSel as any)?.circuito?.seccion || (escuelaSel as any)?.seccion;
                      const codigo = s?.codigo ?? s?.numero ?? s?.id;
                      const nombre = s?.nombre ?? "San Miguel";
                      return codigo ? `${codigo} - ${nombre}` : "53 - San Miguel";
                    })()}
                    circuitoValor={String(circuitoValor || "-")}
                    mesaValor={String(mesaValor || "-")}
                  />

                  <MesaSelector
                    control={form.control}
                    setValue={form.setValue}
                    onEscuelaSeleccionada={setEscuelaSel}
                    escuelaFija={defaultEscuela}
                    bloquearEscuela={!!defaultEscuela}
                    onSinMesasChange={handleSinMesasChange}
                  />

                  <Separator />
                  <TotalesForm control={form.control} setValue={form.setValue} />
                </section>
              )}
            </>
          )}

          {step === 1 && (
            <section className="space-y-4 -mx-4 px-4 overflow-x-auto">
              <CertificadoHeaderSummary />
              {!step1Ready ? (
                <CommonLoader
                  logo="/logo.png"
                  alternativeLogo="/logo-white.png"
                  alternativeText="Más San Miguel 2025"
                  title="Elecciones Provinciales"
                  subTitle="San Miguel 2025"
                  loaderText="Cargando agrupaciones y permisos…"
                />
              ) : (
                <ResultadosPresidencialesForm
                  control={form.control}
                  resultadosPresidenciales={form.getValues().resultadosPresidenciales}
                  categorias={categorias}
                  agrupaciones={agrupaciones}
                  habilitadosPorAgrupacion={habilitadosPorAgrupacion}
                  loadingPermisos={false}
                />
              )}
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4 -mx-4 px-4 overflow-x-auto">
              <CertificadoHeaderSummary />
              <VotosEspecialesForm control={form.control} categorias={categorias} />
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4 -mx-4 px-4 overflow-x-auto">
              <ResumenValidacionTotalesPorColumna control={form.control} categorias={categorias} />
              {hayInconsistenciasGlobal && <ErrorsCertificateSummary errores={mensajes} />}
            </section>
          )}
        </main>

        {!noHayMesas && (
          <>
            {/* Footer */}
            <Separator className="mb-2" />
            <footer
              className="sticky bottom-0 bg-background/90 backdrop-blur px-4 py-3"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
            >
              <div className="flex gap-2">
                {canBack && (
                  <Button type="button" variant="outline" className="flex-1" onClick={back} disabled={saving}>
                    Atrás
                  </Button>
                )}

                {isLast ? (
                  <>
                    <Button
                      type="submit"
                      className="flex-1"
                      onClick={(e) => {
                        if (hayInconsistenciasGlobal) {
                          e.preventDefault();
                          setConfirmOpen(true);
                        }
                      }}
                      disabled={saving}
                      variant={hayInconsistenciasGlobal ? "destructive" : "default"}
                    >
                      {saving ?
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          Guardando…
                        </>
                        : "Guardar"}
                    </Button>

                    {React.createElement(require("./components/SaveConfirmDialog").SaveConfirmDialog, {
                      open: confirmOpen,
                      onOpenChange: setConfirmOpen,
                      onConfirm: confirmarGuardarIgual,
                    })}
                  </>
                ) : (
                  <Button type="button" className="flex-1" onClick={next} disabled={saving || disabledNext}>
                    Siguiente
                  </Button>
                )}
              </div>
            </footer>
          </>
        )}
      </form>
    </Form>
  );
}
