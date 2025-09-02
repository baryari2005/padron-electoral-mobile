// // src/components/ccertificados/CertificadoWizardMobile.tsx
// "use client";

// import React, { useMemo, useState, useCallback, useEffect } from "react";
// import { useForm, type FieldPath } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";

// import { Form } from "@/components/ui/form";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { toast } from "sonner";

// import {
//   certificadoSchema,
//   type CertificadoFormData,
// } from "@/features/certificados/utils/schema/schema";

// import { MesaSelector } from "@/features/certificados/components/MesaSelector";
// import { TotalesForm } from "@/features/certificados/components/TotalesForm";
// import { CertificadoHeaderSummary } from "@/features/certificados/components/CertificadoHeaderSummary";
// import { ResultadosPresidencialesForm } from "@/features/certificados/components/ResultadosPresidencialesForm";
// import { VotosEspecialesForm } from "@/features/certificados/components/VotosEspecialesForm";
// import { ResumenValidacionTotalesPorColumna } from "@/features/certificados/components/ResumenValidacionTotalesPorColumna";
// import CertificateHeader from "@/features/certificados/components/CertificateHeader";
// import type { EstablecimientoConCircuito } from "@/features/certificados/types/types";

// import { useCategorias } from "@/features/certificados/hooks/useCategorias";
// import { useAgrupaciones } from "@/features/certificados/hooks/useAgrupaciones";
// import { usePermisosMatriz } from "@/features/certificados/hooks/usePermisosMatriz";
// import { useCertificadoDefaults } from "@/features/certificados/hooks/useCertificadoDefaults";

// import MobileStepHeader from "@/features/certificados/components/MobileStepHeader";
// import { ErrorsCertificateSummary } from "@/features/certificados/components/ErrorsCertificateSummary";

// import { useAuthStore } from "@/stores/useAuthStore";
// import { UsuarioEstablecimientoLite } from "../common/types/types";
// import { CommonLoader } from "../common/CommonLoader";
// import { CheckCircle } from "lucide-react";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "../ui/alert-dialog";

// // ===================================================
// // Helpers (podés moverlos a /utils si querés)
// // ===================================================

// const STEPS = ["Mesa y Totales", "Votos por Agrupaciones", "Votos especiales", "Resumen y Guardado"] as const;

// const STEP_FIELDS: Record<number, FieldPath<CertificadoFormData>[]> = {
//   0: ["mesa.escuelaId", "mesa.numeroMesa", "totales.sobres", "totales.votantes"],
//   1: [],
//   2: [],
// };

// const toNum = (n: unknown) => (Number.isFinite(Number(n)) ? Number(n) : 0);

// function toApiPayload(values: CertificadoFormData, categorias: { id: string }[]) {
//   const votosEspeciales: Record<string, any> = {};
//   for (const [catId, obj] of Object.entries(values.votosEspeciales || {})) {
//     const o = obj as any;
//     votosEspeciales[String(catId)] = {
//       nulos: toNum(o?.nulos),
//       recurridos: toNum(o?.recurridos),
//       impugnados: toNum(o?.impugnados),
//       comandoElectoral: toNum(o?.comandoElectoral),
//       blancos: toNum(o?.blancos),
//     };
//   }

//   const resultados: Array<{ categoria: string; agrupacionId: string; votos: number }> = [];
//   for (const row of values.resultadosPresidenciales || []) {
//     const agrupacionId = String((row as any)?.agrupacionId ?? "");
//     for (const cat of categorias) {
//       resultados.push({
//         categoria: String(cat.id),
//         agrupacionId,
//         votos: toNum((row as any)?.[cat.id]),
//       });
//     }
//   }

//   return {
//     establecimientoId: String(values.mesa.escuelaId ?? ""),
//     numeroMesa: toNum(values.mesa.numeroMesa),
//     circuitoId:
//       values.mesa.circuitoId !== undefined && values.mesa.circuitoId !== null
//         ? toNum(values.mesa.circuitoId)
//         : undefined,
//     totales: {
//       sobres: toNum(values.totales.sobres),
//       votantes: toNum(values.totales.votantes),
//       diferencia: toNum(values.totales.diferencia),
//     },
//     votosEspeciales,
//     resultados,
//   };
// }

// const fechaEs = new Intl.DateTimeFormat("es-AR", {
//   day: "2-digit",
//   month: "long",
//   year: "numeric",
// }).format(new Date());

// function getDefaultEscuelaFromUser(user: unknown): EstablecimientoConCircuito | null {
//   if (
//     user &&
//     typeof user === "object" &&
//     "escuelas" in (user as any) &&
//     Array.isArray((user as any).escuelas)
//   ) {
//     const escuelas = (user as any).escuelas as UsuarioEstablecimientoLite[];
//     const conPrioridad = escuelas.find((e) => e?.principal) ?? escuelas[0];
//     if (conPrioridad?.establecimiento) {
//       return conPrioridad.establecimiento as EstablecimientoConCircuito;
//     }
//   }
//   return null;
// }

// // ===================================================
// // Mini-componentes (podés moverlos a /components si querés)
// // ===================================================

// function SuccessScreen({
//   summary,
//   onReset,
// }: {
//   summary: { escuela: string; circuito?: string | number; mesa: string | number };
//   onReset: () => void;
// }) {
//   return (
//     <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-10 text-center">
//       <CheckCircle className="h-16 w-16 text-emerald-600 mb-4" />
//       <h1 className="text-2xl font-bold mb-2">¡Certificado registrado!</h1>
//       <p className="text-muted-foreground mb-6">
//         Se registraron los votos de la <b>mesa {String(summary.mesa)}</b>
//         {summary.escuela ? (
//           <>
//             {" "}
//             en <b>{summary.escuela}</b>
//           </>
//         ) : null}
//         {summary.circuito ? (
//           <>
//             {" "}
//             (Circuito <b>{String(summary.circuito)}</b>)
//           </>
//         ) : null}
//         .
//       </p>
//       <div className="flex gap-3">
//         <Button onClick={onReset}>Cargar otra mesa</Button>
//       </div>
//     </div>
//   );
// }

// function SaveConfirmDialog({
//   open,
//   onOpenChange,
//   onConfirm,
// }: {
//   open: boolean;
//   onOpenChange: (v: boolean) => void;
//   onConfirm: () => void;
// }) {
//   return (
//     <AlertDialog open={open} onOpenChange={onOpenChange}>
//       <AlertDialogContent>
//         <AlertDialogHeader>
//           <AlertDialogTitle>Se detectaron inconsistencias</AlertDialogTitle>
//           <AlertDialogDescription asChild>
//             <div className="text-muted-foreground text-sm space-y-2">
//               <p>
//                 El certificado presenta inconsistencias en los totales. Si continúa, el registro se guardará
//                 igualmente <strong>marcado con inconsistencias</strong>.
//               </p>
//               {/* <ul className="list-disc pl-5">
//                 <li>La diferencia entre “electores” y “sobres” debe ser 0.</li>
//               </ul> */}
//               <p className="mt-2">¿Desea continuar?</p>
//             </div>
//           </AlertDialogDescription>
//         </AlertDialogHeader>
//         <AlertDialogFooter>
//           <AlertDialogCancel>Revisar</AlertDialogCancel>
//           <AlertDialogAction onClick={onConfirm}>Guardar de todos modos</AlertDialogAction>
//         </AlertDialogFooter>
//       </AlertDialogContent>
//     </AlertDialog>
//   );
// }

// // ===================================================
// // Componente principal
// // ===================================================

// export default function CertificadoWizardMobile() {
//   // 🔐 Auth
//   const user = useAuthStore((s) => s.user);
//   const token = useAuthStore((s) => s.token);
//   const hasHydrated = useAuthStore((s) => s.hasHydrated);
//   const fetchUser = useAuthStore((s) => s.fetchUser);

//   // 🧹 Limpieza one-shot del storage viejo
//   useEffect(() => {
//     try {
//       if (!localStorage.getItem("auth-store-migrated-v2")) {
//         localStorage.removeItem("auth-store");
//         localStorage.removeItem("token");
//         localStorage.setItem("auth-store-migrated-v2", "1");
//         console.log("🧹 auth-store limpiado (migrated v2)");
//       }
//     } catch { }
//   }, []);

//   // Realinear con /me si hay token pero no user
//   useEffect(() => {
//     if (!hasHydrated) return;
//     if (!user && token) fetchUser();
//   }, [hasHydrated, token, user, fetchUser]);

//   useEffect(() => {
//     console.log("🧑 user:", user);
//     console.log("🔐 token presente:", !!token);
//   }, [user, token]);

//   const form = useForm<CertificadoFormData>({
//     resolver: zodResolver(certificadoSchema),
//     mode: "onChange",
//     defaultValues: {
//       mesa: { escuelaId: "", numeroMesa: "", circuitoId: "" },
//       votosEspeciales: {},
//       totales: { sobres: 0, votantes: 0, diferencia: 0 },
//       resultadosPresidenciales: [],
//     },
//   });

//   const { categorias, loadingCategorias } = useCategorias();
//   const { agrupaciones, loadingAgrupaciones, ready: agrupacionesReady } = useAgrupaciones();
//   const { habilitadosPorAgrupacion, loadingPermisos } = usePermisosMatriz({ ready: agrupacionesReady });

//   const categoriasReady = !!categorias?.length && !loadingCategorias;
//   const permisosReady = !loadingPermisos;
//   const step1Ready = categoriasReady && agrupacionesReady && permisosReady;

//   // Steps
//   const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
//   const isLast = step === STEPS.length - 1;
//   const canBack = step > 0;
//   const [saving, setSaving] = useState(false);

//   // selección de escuela para header
//   const [escuelaSel, setEscuelaSel] = useState<EstablecimientoConCircuito | null>(null);
//   const [escuela, setEscuela] = useState<EstablecimientoConCircuito | null>(null);

//   // ✅ pantalla de éxito
//   const [saveSummary, setSaveSummary] = useState<null | { escuela: string; circuito?: string | number; mesa: string | number }>(null);

//   // Defaults (solo cuando se entra al Paso 1 y hay data)
//   useCertificadoDefaults(form, "crear", agrupaciones, categorias, step >= 1 && step1Ready);

//   // Escuela por defecto desde el user
//   const defaultEscuela = useMemo(() => getDefaultEscuelaFromUser(user), [user]);

//   useEffect(() => {
//     if (defaultEscuela && (!escuela || escuela.id !== (defaultEscuela as any).id)) {
//       setEscuela(defaultEscuela);
//       console.log("✅ Escuela seteada por defecto:", defaultEscuela);
//     }
//   }, [defaultEscuela, escuela]);

//   // --- Inconsistencias (solo la diferencia) ---
//   const [confirmOpen, setConfirmOpen] = useState(false);
//   const diferenciaRaw = form.watch("totales.diferencia");
//   const hayInconsistencias = useMemo(() => {
//     const d = Number(diferenciaRaw ?? 0);
//     return Number.isFinite(d) && d !== 0;
//   }, [diferenciaRaw]);

//   const onClickGuardar = () => {
//     if (hayInconsistencias) setConfirmOpen(true);
//     else form.handleSubmit(handleSave)();
//   };

//   const confirmarGuardarIgual = () => {
//     setConfirmOpen(false);
//     form.handleSubmit(handleSave)();
//   };

//   const mensajesErrores = hayInconsistencias ? "Hay diferencias entre votantes y sobres en urna." : "";

//   // Guardar
//   const handleSave = useCallback(
//     async (values: CertificadoFormData) => {
//       try {
//         setSaving(true);
//         const payload = toApiPayload(values, categorias ?? []);

//         // armo resumen ANTES (por si reseteo el form)
//         const resumen = {
//           escuela: escuelaSel?.nombre ?? (escuela?.nombre ?? "—"),
//           circuito:
//             (escuelaSel as any)?.circuito?.nombre ??
//             (escuelaSel as any)?.circuito?.codigo ??
//             (escuelaSel as any)?.circuito?.numero ??
//             undefined,
//           mesa: payload.numeroMesa,
//         };

//         const res = await fetch("/api/scrutiny-certificates", {
//           method: "POST",
//           headers: { "Content-Type": "application/json", Accept: "application/json" },
//           body: JSON.stringify(payload),
//           cache: "no-store",
//         });

//         const text = await res.text().catch(() => "");
//         let data: any = null;
//         try {
//           data = text ? JSON.parse(text) : null;
//         } catch {
//           data = text;
//         }

//         if (!res.ok) {
//           const err = data?.error ?? data;
//           let msg = `Error ${res.status}`;
//           if (typeof err === "string") msg = err;
//           else if (Array.isArray(err)) msg = err.map((i: any) => i?.message || JSON.stringify(i)).join("\n");
//           else if (err?.issues) msg = err.issues.map((i: any) => `${(i.path || []).join(".")}: ${i.message}`).join("\n");
//           throw new Error(msg);
//         }

//         toast.success("Certificado guardado con éxito.");
//         setSaveSummary(resumen); // pantalla de confirmación
//         form.reset();
//         setEscuelaSel(null);
//         setStep(0);
//       } catch (e: any) {
//         console.error("[save] error:", e);
//         toast.error(e?.message ?? "Error al guardar el certificado.");
//       } finally {
//         setSaving(false);
//       }
//     },
//     [categorias, form, escuela, escuelaSel]
//   );

//   // navegación
//   const next = async () => {
//     const fields = STEP_FIELDS[step] ?? [];
//     if (fields.length) {
//       const ok = await form.trigger(fields, { shouldFocus: true });
//       if (!ok) return;
//     }
//     setStep((s) => (s < STEPS.length - 1 ? ((s + 1) as typeof s) : s));
//   };
//   const back = () => setStep((s) => (s > 0 ? ((s - 1) as typeof s) : s));

//   const disabledNext = saving || (step === 0 && !step1Ready);

//   // Header data
//   const circuitoValor = useMemo(() => {
//     const c: any = (escuelaSel as any)?.circuito;
//     return c?.nombre ?? c?.codigo ?? c?.numero ?? "-";
//   }, [escuelaSel]);

//   const mesaValor = form.watch("mesa.numeroMesa") || "-";

//   // ✅ Pantalla de éxito
//   if (saveSummary) {
//     return <SuccessScreen summary={saveSummary} onReset={() => { setSaveSummary(null); form.reset(); setEscuelaSel(null); setStep(0); }} />;
//   }

//   return (
//     <Form {...form}>
//       <form
//         noValidate
//         onSubmit={(e) => {
//           if (!isLast) {
//             e.preventDefault();
//             e.stopPropagation();
//           }
//         }}
//         onKeyDown={(e) => {
//           if (!isLast && (e.key === "Enter" || e.key === "NumpadEnter")) {
//             e.preventDefault();
//             e.stopPropagation();
//           }
//         }}
//         className="min-h-[100dvh] flex flex-col"
//       >
//         {/* Header */}
//         <header className="sticky top-0 z-40 bg-background/80 backdrop-blur">
//           <MobileStepHeader
//             step={step}
//             steps={STEPS}
//             escuela={escuelaSel?.nombre ?? null}
//             circuito={String(circuitoValor || "-")}
//             mesa={String(mesaValor || "-")}
//             loadingText={step === 1 && !step1Ready ? "Cargando agrupaciones…" : undefined}
//             avatarColor="emerald"
//           />
//           <Separator />
//         </header>

//         {/* Main */}
//         <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
//           {step === 0 && (
//             <section className="space-y-4">
//               <CertificateHeader
//                 fecha={fechaEs}
//                 seccionValor={(() => {
//                   const s: any = (escuelaSel as any)?.circuito?.seccion || (escuelaSel as any)?.seccion;
//                   const codigo = s?.codigo ?? s?.numero ?? s?.id;
//                   const nombre = s?.nombre ?? "San Miguel 2025";
//                   return codigo ? `${codigo} - ${nombre}` : "53 - San Miguel 2025";
//                 })()}
//                 circuitoValor={String(circuitoValor || "-")}
//                 mesaValor={String(mesaValor || "-")}
//               />

//               <MesaSelector
//                 control={form.control}
//                 setValue={form.setValue}
//                 onEscuelaSeleccionada={setEscuelaSel}
//                 escuelaFija={defaultEscuela}
//                 bloquearEscuela={!!defaultEscuela}
//               />

//               <Separator />
//               <TotalesForm control={form.control} setValue={form.setValue} />
//             </section>
//           )}

//           {step === 1 && (
//             <section className="space-y-4 -mx-4 px-4 overflow-x-auto">
//               <CertificadoHeaderSummary />
//               {!step1Ready ? (
//                 <CommonLoader
//                   logo="/logo.png"
//                   alternativeLogo="/logo-white.png"
//                   alternativeText="Más San Miguel 2025"
//                   title="Elecciones Provinciales"
//                   subTitle="San Miguel 2025"
//                   loaderText="Cargando agrupaciones y permisos…"
//                 />
//               ) : (
//                 <ResultadosPresidencialesForm
//                   control={form.control}
//                   resultadosPresidenciales={form.getValues().resultadosPresidenciales}
//                   categorias={categorias}
//                   agrupaciones={agrupaciones}
//                   habilitadosPorAgrupacion={habilitadosPorAgrupacion}
//                   loadingPermisos={false}
//                 />
//               )}
//             </section>
//           )}

//           {step === 2 && (
//             <section className="space-y-4 -mx-4 px-4 overflow-x-auto">
//               <CertificadoHeaderSummary />
//               <VotosEspecialesForm control={form.control} categorias={categorias} />
//             </section>
//           )}

//           {step === 3 && (
//             <section className="space-y-4 -mx-4 px-4 overflow-x-auto">
//               <ResumenValidacionTotalesPorColumna control={form.control} categorias={categorias} />
//               {hayInconsistencias && <ErrorsCertificateSummary errores={mensajesErrores} />}
//             </section>
//           )}
//         </main>

//         {/* Footer */}
//         <Separator className="mb-2" />
//         <footer
//           className="sticky bottom-0 bg-background/90 backdrop-blur px-4 py-3"
//           style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
//         >
//           <div className="flex gap-2">
//             {canBack && (
//               <Button type="button" variant="outline" className="flex-1" onClick={back} disabled={saving}>
//                 Atrás
//               </Button>
//             )}

//             {isLast ? (
//               <>
//                 <Button
//                   type="button"
//                   className="flex-1"
//                   onClick={onClickGuardar}
//                   disabled={saving}
//                   variant={hayInconsistencias ? "destructive" : "default"}
//                 >
//                   {saving ? "Guardando…" : "Guardar"}
//                 </Button>

//                 <SaveConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} onConfirm={confirmarGuardarIgual} />
//               </>
//             ) : (
//               <Button type="button" className="flex-1" onClick={next} disabled={disabledNext}>
//                 Siguiente
//               </Button>
//             )}
//           </div>
//         </footer>
//       </form>
//     </Form>
//   );
// }
