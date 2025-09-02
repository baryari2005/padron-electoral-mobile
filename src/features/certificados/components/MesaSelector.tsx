// src/features/certificados/components/MesaSelector.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { CertificadoFormData } from "../utils/schema/schema";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormCombo } from "./FormCombo";
import { EstablecimientoConCircuito } from "../types/types";
import { Loader2 } from "lucide-react";

interface MesaSelectorProps {
  control: UseFormReturn<CertificadoFormData>["control"];
  setValue: UseFormReturn<CertificadoFormData>["setValue"];
  onEscuelaSeleccionada?: (establecimiento: EstablecimientoConCircuito) => void;
  onSinMesasChange?: (info: {
    sinMesas: boolean;
    establecimiento: EstablecimientoConCircuito | null;
  }) => void;
  escuelaFija?: EstablecimientoConCircuito | null;
  bloquearEscuela?: boolean;
  disabled?: boolean;
}

export function MesaSelector({
  control,
  setValue,
  onEscuelaSeleccionada,
  onSinMesasChange,
  escuelaFija = null,
  bloquearEscuela = false,
  disabled,
}: MesaSelectorProps) {
  const disableEscuela = bloquearEscuela || !!disabled;

  const [loadingEstablecimientos, setLoading] = useState(true);
  const [escuelas, setEscuelas] = useState<EstablecimientoConCircuito[]>([]);
  const [escuelaSeleccionada, setEscuelaSeleccionada] =
    useState<EstablecimientoConCircuito | null>(null);

  const [mesasDisponibles, setMesasDisponibles] = useState<{ numero: number }[]>(
    []
  );
  const [loadingMesas, setLoadingMesas] = useState(false);

  const onSinMesasChangeRef = useRef(onSinMesasChange);
  useEffect(() => {
    onSinMesasChangeRef.current = onSinMesasChange;
  }, [onSinMesasChange]);

  // ✅ Recibe el OBJETO establecimiento (así podemos reportarlo a onSinMesasChange)
  const cargarMesasDisponibles = useCallback(
    async (establecimiento: EstablecimientoConCircuito) => {
      try {
        setLoadingMesas(true);
        const res = await fetch(
          `/api/establishments/${establecimiento.id}/available-tables`,
          { cache: "no-store", headers: { Accept: "application/json" } }
        );
        const text = await res.text().catch(() => "");
        let body: any = null;
        try {
          body = text ? JSON.parse(text) : null;
        } catch {
          body = text;
        }
        if (!res.ok) {
          const msg = body?.error || body?.message || `Error ${res.status}`;
          throw new Error(msg);
        }
        const items = body?.items ?? body ?? [];
        const mesasFiltradas = items.filter((m: any) => !m.escrutada);
        setMesasDisponibles(mesasFiltradas);

        onSinMesasChangeRef.current?.({
          sinMesas: mesasFiltradas.length === 0,
          establecimiento: establecimiento ?? null,
        });
      } catch (err) {
        console.error("❌ Error al cargar mesas disponibles", err);
        setMesasDisponibles([]);
        onSinMesasChangeRef.current?.({ sinMesas: true, establecimiento: establecimiento ?? null });
      } finally {
        setLoadingMesas(false);
      }
    },
    [onSinMesasChange]
  );

  // 1) Si viene escuelaFija desde /me, la seteamos y evitamos pedir todas
  useEffect(() => {
    if (!escuelaFija) return;

    setEscuelas([escuelaFija]);           // ← NO se vuelve a pedir /establishments
    setEscuelaSeleccionada(escuelaFija);

    // setear valores en el form
    setValue("mesa.escuelaId", String(escuelaFija.id), { shouldDirty: true, shouldTouch: true });
    if (escuelaFija.circuito?.id) {
      setValue("mesa.circuitoId", String(escuelaFija.circuito.id), { shouldDirty: true, shouldTouch: true });
    }
    setValue("mesa.numeroMesa", "", { shouldDirty: true, shouldTouch: true });

    onEscuelaSeleccionada?.(escuelaFija);
    cargarMesasDisponibles(escuelaFija);  // 👈 pasamos el objeto
    setLoading(false);
  }, [escuelaFija, setValue, onEscuelaSeleccionada, cargarMesasDisponibles]);

  // 2) Si NO hay escuelaFija, traemos todas las escuelas
  useEffect(() => {
    if (escuelaFija) return; // ya manejado arriba
    let alive = true;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/establishments?all=true", { cache: "no-store" });
        const data = await res.json();
        const items = Array.isArray(data) ? data : data?.items ?? [];
        if (alive) setEscuelas(items);
      } catch (err) {
        console.error("❌ Error al cargar escuelas", err);
        if (alive) setEscuelas([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [escuelaFija]);

  return (
    <section className="bg-card border border-border rounded-2xl shadow-sm p-4 md:p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[68%_30%] gap-4 md:gap-x-6 items-start">
        {/* ESCUELA */}
        <FormField
          control={control}
          name="mesa.escuelaId"
          render={({ field }) => {
            const triggerId = "escuela-escuelaId-trigger";
            const labelId = "escuela-escuelaId-label";
            return (
              <FormItem>
                <FormLabel
                  id={labelId}
                  htmlFor={triggerId}
                  className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold"
                >
                  Escuela / Establecimiento
                </FormLabel>
                <FormControl>
                  <FormCombo<EstablecimientoConCircuito>
                    id={triggerId}
                    labelId={labelId}
                    value={String(field.value ?? "")}
                    onChange={(v) => field.onChange(v)}
                    options={escuelas}
                    getOptionLabel={(e) => e.nombre}
                    getOptionValue={(e) => String(e.id)}
                    placeholder={
                      loadingEstablecimientos ? "Cargando escuelas…" : "Seleccionar…"
                    }
                    onOptionSelected={async (establecimiento) => {
                      if (!establecimiento) return;

                      setEscuelaSeleccionada(establecimiento);
                      onEscuelaSeleccionada?.(establecimiento);

                      // actualizar form
                      field.onChange(String(establecimiento.id));
                      if (establecimiento?.circuito?.id) {
                        setValue("mesa.circuitoId", String(establecimiento.circuito.id), { shouldDirty: true });
                      }
                      setValue("mesa.numeroMesa", "", { shouldDirty: true });

                      await cargarMesasDisponibles(establecimiento); // 👈 pasamos el objeto
                    }}
                    disabled={disableEscuela || loadingEstablecimientos}
                    className="h-11 rounded-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {/* NÚMERO DE MESA */}
        <FormField
          control={control}
          name="mesa.numeroMesa"
          render={({ field }) => {
            const triggerId = "escuela-nromesa-trigger";
            const labelId = "escuela-nromesa-label";

            if (!escuelaSeleccionada) {
              return (
                <FormItem>
                  <FormLabel
                    id={labelId}
                    htmlFor="nro-mesa-readonly"
                    className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold"
                  >
                    Número de Mesa
                  </FormLabel>
                  <FormControl>
                    <Input id="nro-mesa-readonly" value={`${field.value ?? ""}`} disabled readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }

            return (
              <FormItem>
                <FormLabel
                  id={labelId}
                  htmlFor={triggerId}
                  className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold"
                >
                  Número de Mesa
                </FormLabel>
                <FormControl>
                  {loadingMesas ? (
                    <div className="relative">
                      <Input
                        id="nro-mesa-loading"
                        value="Cargando mesas…"
                        readOnly
                        disabled
                        aria-busy="true"
                        className="pr-10 animate-pulse"
                      />
                      <Loader2
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground"
                        aria-hidden
                      />
                    </div>
                  ) : (
                    <FormCombo<{ numero: number }>
                      id={triggerId}
                      labelId={labelId}
                      value={String(field.value ?? "")}
                      onChange={(v) => field.onChange(v)}
                      options={mesasDisponibles}
                      getOptionLabel={(m) => `Mesa ${m.numero}`}
                      getOptionValue={(m) => String(m.numero)}
                      placeholder={
                        mesasDisponibles.length
                          ? "Seleccionar…"
                          : "Sin mesas disponibles"
                      }
                      disabled={mesasDisponibles.length === 0}
                      className="h-11 rounded-xl"
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
    </section>
  );
}
