"use client";

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CertificadoFormData } from "../utils/schema/schema";


import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input"; // si preferís el input de shadcn
import { FormCombo } from "./FormCombo";
import { EstablecimientoConCircuito } from "../types/types";
import { clientFetchItems as clientFetch } from "@/lib/client-fetch";

interface MesaSelectorProps {
  control: UseFormReturn<CertificadoFormData>["control"];
  setValue: UseFormReturn<CertificadoFormData>["setValue"];
  onEscuelaSeleccionada?: (establecimiento: EstablecimientoConCircuito) => void;
  disabled?: boolean;
}

export function MesaSelector({
  control,
  setValue,
  onEscuelaSeleccionada,
  disabled,
}: MesaSelectorProps) {
  const [loadingEstablecimientos, setLoading] = useState(true);
  const [escuelas, setEscuelas] = useState<EstablecimientoConCircuito[]>([]);
  const [escuelaSeleccionada, setEscuelaSeleccionada] =
    useState<EstablecimientoConCircuito | null>(null);
  const [mesasDisponibles, setMesasDisponibles] = useState<{ numero: number }[]>(
    []
  );


  useEffect(() => {
    let alive = true;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/establishments?all=true", { cache: "no-store" });
        const data = await res.json(); // ← tu RAW muestra que es un array puro
        const items = Array.isArray(data) ? data : (data?.items ?? []);

        console.log("Establecimientos (direct fetch)", items.length, items);
        if (alive) setEscuelas(items);
      } catch (err) {
        console.error("❌ Error al cargar escuelas (direct fetch)", err);
        if (alive) setEscuelas([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

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
                    onOptionSelected={async (establecimiento) => {
                      if (establecimiento?.circuito?.id) {
                        setValue("mesa.circuitoId", String(establecimiento.circuito.id));
                      }
                      setValue("mesa.numeroMesa", "");
                      setEscuelaSeleccionada(establecimiento);
                      onEscuelaSeleccionada?.(establecimiento);

                      try {
                        const res = await fetch(
                          `/api/establishments/${establecimiento.id}/available-tables`,
                          { cache: "no-store", headers: { Accept: "application/json" } }
                        );
                        const text = await res.text().catch(() => "");
                        let body: any = null;
                        try { body = text ? JSON.parse(text) : null; } catch { body = text; }
                        if (!res.ok) {
                          const msg = body?.error || body?.message || `Error ${res.status}`;
                          throw new Error(msg);
                        }
                        const items = body?.items ?? body ?? [];
                        const mesasFiltradas = items.filter((m: any) => !m.escrutada);
                        setMesasDisponibles(mesasFiltradas);
                      } catch (err) {
                        console.error("Error al cargar mesas disponibles", err);
                      }
                    }}
                    disabled={disabled}
                    className="h-11 rounded-xl"      // si tu FormCombo propaga className al trigger
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

            if (disabled) {
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
                  <FormCombo<{ numero: number }>
                    id={triggerId}
                    labelId={labelId}
                    value={String(field.value ?? "")}
                    onChange={(v) => field.onChange(v)}
                    options={mesasDisponibles}
                    getOptionLabel={(m) => `Mesa ${m.numero}`}
                    getOptionValue={(m) => String(m.numero)}
                    disabled={!escuelaSeleccionada}
                    className="h-11 rounded-xl"
                  />
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
