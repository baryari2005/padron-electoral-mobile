"use client";

import { TriangleAlert } from "lucide-react";

interface Props {
  errores: string; // cantidad de errores
}

export function ErrorsCertificateSummary({ errores }: Props) {
  return (
    <section className="bg-card border border-border rounded-2xl shadow-sm p-4 md:p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[68%_30%] gap-4 md:gap-x-6 items-start">
        <div className="text-xs text-red-800">
          <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium italic">
            <TriangleAlert className="w-4 h-4 shrink-0" />
            <span className="font-bold">Errores:</span>
            <span>{errores}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
