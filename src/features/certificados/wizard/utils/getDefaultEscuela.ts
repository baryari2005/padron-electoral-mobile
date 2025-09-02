// src/features/certificados/wizard/utils/getDefaultEscuela.ts
import type { EstablecimientoConCircuito } from "@/features/certificados/types/types";
import type { UsuarioEstablecimientoLite } from "@/components/common/types/types";

export function getDefaultEscuelaFromUser(user: unknown): EstablecimientoConCircuito | null {
  if (
    user &&
    typeof user === "object" &&
    "escuelas" in (user as any) &&
    Array.isArray((user as any).escuelas)
  ) {
    const escuelas = (user as any).escuelas as UsuarioEstablecimientoLite[];
    const conPrioridad = escuelas.find((e) => e?.principal) ?? escuelas[0];
    if (conPrioridad?.establecimiento) {
      return conPrioridad.establecimiento as EstablecimientoConCircuito;
    }
  }
  return null;
}
