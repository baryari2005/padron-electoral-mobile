"use client";
import { useEffect, useState } from "react";
import { clientFetchItems as clientFetch } from "@/lib/client-fetch";

type Agrupacion = {
  id: number;
  userId: string;
  nombre: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  profileImage: string | null;
  numero: number;
  color_hex: string;
}

export function useAgrupaciones() {
  const [agrupaciones, setAgrupaciones] = useState<Agrupacion[]>([]);
  const [loadingAgrupaciones, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    clientFetch<Agrupacion>("/api/political-groups?all=true")
      .then((items) => { if (alive) setAgrupaciones(items); })
      .catch((err) => {
        console.error("❌ Error al cargar agrupaciones", err);
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return { agrupaciones, loadingAgrupaciones };
}
