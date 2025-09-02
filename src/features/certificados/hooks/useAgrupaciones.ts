// src/features/certificados/hooks/useAgrupaciones.ts
"use client";
import { useEffect, useState } from "react";
import { clientFetchItems as clientFetch } from "@/lib/client-fetch";

export type Agrupacion = {
  id: number;
  userId: string;
  nombre: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  profileImage?: string | null;
  numero?: number;
  color_hex?: string;
};

const isPlaceholder = (s?: string) => {
  if (!s) return true;
  const t = s.trim().toUpperCase();
  return t === "" || t === "SIN NOMBRE" || t === "S/N" || t === "SN";
};

export function useAgrupaciones() {
  const [agrupaciones, setAgrupaciones] = useState<Agrupacion[]>([]);
  const [loadingAgrupaciones, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    clientFetch<Agrupacion>("/api/political-groups?all=true")
      .then((items) => {
        if (!alive) return;

        // normalizamos nombre para evitar “SIN NOMBRE”
        const norm = (items || []).map((a) => {
          const nombreCrudo =
            a?.nombre ??
            // por si tu API trae otro campo:
            (a as any)?.denominacion ??
            (a as any)?.title ??
            (a as any)?.name ??
            (a as any)?.sigla ??
            "";

          let nombre = String(nombreCrudo || "").trim();

        // si sigue vacío, armamos uno legible
          if (isPlaceholder(nombre)) {
            if (a?.numero) nombre = `Lista ${a.numero}`;
            else nombre = `Agrupación #${a?.id ?? "?"}`;
          }

          return { ...a, nombre };
        });

        setAgrupaciones(norm);
      })
      .catch((err) => {
        console.error("❌ Error al cargar agrupaciones", err);
        setError(err?.message ?? "Error al cargar agrupaciones");
        setAgrupaciones([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  // listo cuando TODAS tienen nombre válido
  const ready =
    !loadingAgrupaciones &&
    agrupaciones.length > 0 &&
    agrupaciones.every((a) => !isPlaceholder(a?.nombre));

  return { agrupaciones, loadingAgrupaciones, ready, error };
}
