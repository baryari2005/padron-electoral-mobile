"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EstablecimientoConCircuito } from "@/features/certificados/types/types";
import Link from "next/link";

export function EscuelaCompletadaScreen({
  escuela,
  onElegirOtraEscuela,
  onVolver,
  puedeElegirOtra,
}: {
  escuela: EstablecimientoConCircuito;
  onElegirOtraEscuela?: () => void;
  onVolver: () => void;
  puedeElegirOtra?: boolean;
}) {
  return (
    <div className="min-h-[60dvh] flex flex-col items-center justify-center text-center p-6">
      <CheckCircle className="h-14 w-14 text-emerald-600 mb-4" />
      <h2 className="text-2xl font-bold mb-2">¡Escuela completa!</h2>
      <p className="text-muted-foreground mb-6">
        Ya se realizó el escrutinio total de la escuela <b>{escuela?.nombre ?? "—"}</b>.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        {puedeElegirOtra && onElegirOtraEscuela ? (
          <Button variant="outline" onClick={onElegirOtraEscuela}>
            Elegir otra escuela
          </Button>
        ) : null}
        <Button type="button"><Link href="/login">Volver</Link></Button>
      </div>
    </div>
  );
}
