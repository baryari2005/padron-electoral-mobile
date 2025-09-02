// src/features/certificados/wizard/components/SuccessScreen.tsx
"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export function SuccessScreen({
  summary,
  onReset,
}: {
  summary: { escuela: string; circuito?: string | number; mesa: string | number };
  onReset: () => void;
}) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-10 text-center">
      <CheckCircle className="h-16 w-16 text-emerald-600 mb-4" />
      <h1 className="text-2xl font-bold mb-2">¡Certificado registrado!</h1>
      <p className="text-muted-foreground mb-6">
        Se registraron los votos de la <b>mesa {String(summary.mesa)}</b>
        {summary.escuela ? <> en <b>{summary.escuela}</b></> : null}
        {summary.circuito ? <> (Circuito <b>{String(summary.circuito)}</b>)</> : null}.
      </p>
      <div className="flex gap-3">
        <Button onClick={onReset}>Cargar otra mesa</Button>
      </div>
    </div>
  );
}
