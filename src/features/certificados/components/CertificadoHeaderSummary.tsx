// 🧩 Archivo: components/CertificadoForm/CertificadoHeaderSummary.tsx
"use client";

export function CertificadoHeaderSummary() {
  return (
    <section className="bg-card border border-border rounded-2xl shadow-sm p-4 md:p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[68%_30%] gap-4 md:gap-x-6 items-start">
        <div className="text-xs font-medium italic text-center text-muted-foreground ">
          <span className="font-bold">CERTIFICO:</span> en mi carácter de presidente de esta mesa, de acuerdo con lo establecido en los arts. 102 y 102 bis del Código Electoral Nacional que el escrutinio arrojó los siguientes resultados
        </div>
      </div>
    </section>
  );
}