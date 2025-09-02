"use client";

import Image from "next/image";

type Props = {
  fecha?: string;                         // ej: "24 de agosto de 2025"
  seccionTitulo?: string;                 // ej: "SECCIÓN ELECTORAL"
  seccionValor?: string;                  // ej: "53 - San Miguel 2025"
  circuitoLabel?: string;                 // ej: "CIRCUITO"
  circuitoValor?: string;
  mesaLabel?: string;                     // ej: "MESA"
  mesaValor?: string;
};

export default function CertificateHeader({
  fecha = "",
  seccionTitulo = "SECCIÓN ELECTORAL",
  seccionValor = "",
  circuitoLabel = "CIRCUITO",
  circuitoValor = "-",
  mesaLabel = "MESA",
  mesaValor = "-",
}: Props) {
  return (
    <header className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        {/* Izquierda: escudo + textos */}
        <div className="flex items-start gap-4">
          <Image
            src="/escudo-arg.png"       // poné tu imagen aquí
            alt="Escudo"
            width={40}
            height={40}            
          />

          <div className="space-y-1">
            <h1 className="text-lg md:text-3xl font-extrabold tracking-tight">
              Carga de Certificado de Escrutinio
            </h1>

            <div className="text-sm leading-tight">
              <div className="font-semibold">JUNTA ELECTORAL NACIONAL</div>
              <div className="text-muted-foreground">DISTRITO BUENOS AIRES</div>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
