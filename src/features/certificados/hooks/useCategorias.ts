// src/features/certificados/hooks/useCategorias.ts
"use client";
import { useEffect, useState } from "react";

export type Categoria = { id: string; nombre: string };

export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/categories?all=true", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const payload = await res.json().catch(() => null);
        const items: Categoria[] = Array.isArray(payload)
          ? payload
          : (payload?.items ?? []);
        if (alive) setCategorias(items);
      } catch (e) {
        console.error("❌ Error al cargar categorías", e);
        if (alive) setCategorias([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  return { categorias, loadingCategorias };
}
