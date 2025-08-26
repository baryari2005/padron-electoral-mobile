// src/features/certificados/components/MobileStepHeader.tsx
"use client";

import { Logo } from "@/app/components/Logo";
import { Separator } from "@/components/ui/separator";
import { MapPinned, School, Table2, Hash } from "lucide-react";
import UserAvatar from "@/components/auth/UserAvatar"; // 👈 nombre/ruta correctos
import { cn } from "@/lib/utils";

type Props = {
  step: number;                         // 0-based
  steps: readonly string[];
  escuela?: string | null;              // e.g. "COLEGIO ABERDARE (EP/ES)"
  colegio?: string | number | null;     // e.g. 214
  circuito?: string | number | null;    // e.g. "8397A"
  mesa?: string | number | null;        // e.g. 490
  loadingText?: string;
  avatarColor?: "muted" | "primary" | "emerald" | "sky" | "rose";
};

// Chip con Escuela + Nº colegio + Circuito (en una sola línea, con elipsis)
function CompositeChip({
  escuela,  
  circuito,
  className,
}: {
  escuela?: string | null;  
  circuito?: string | number | null;
  className?: string;
}) {
  if (!escuela && !circuito) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted",
        "px-2 py-1 text-[11px] whitespace-nowrap overflow-hidden",
        className
      )}
      title={[escuela, circuito].filter(Boolean).join(" · ")}
    >
      {escuela && (
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <School className="w-3.5 h-3.5 opacity-60 shrink-0" />
          <strong className="font-medium truncate">{escuela}</strong>
        </span>
      )}

      {(circuito) && <span className="h-3 w-px bg-border mx-1" />}

      {circuito && (
        <>
          <span className="h-3 w-px bg-border mx-1" />
          <span className="inline-flex items-center gap-1.5">
            <MapPinned className="w-3.5 h-3.5 opacity-60" />
            <strong className="font-mono">{circuito}</strong>
          </span>
        </>
      )}
    </span>
  );
}

export default function MobileStepHeader({
  step,
  steps,
  escuela,  
  circuito,
  mesa,
  loadingText,
  avatarColor = "primary",
}: Props) {
  const total = steps.length || 1;
  const pct = Math.min(100, Math.max(0, Math.round(((step + 1) / total) * 100)));
  const title = steps[step] ?? "";

  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur">
      <div className="px-4 py-2">
        <div className="flex items-center justify-center">
          <Logo />
        </div>

        {/* Paso y título */}
        <div className="flex items-center justify-between gap-3 mt-3">
          <span className="text-[11px] text-muted-foreground">
            Paso {step + 1} / {total}
          </span>
          <span className="text-sm font-medium truncate">{title}</span>
        </div>

        {/* Barra de progreso */}
        <div className="mt-2 h-1.5 rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${pct}%` }}  // 👈 template string correcta
            aria-hidden
          />
        </div>

        {/* Chips (una sola línea) + avatar */}
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
          <CompositeChip
            escuela={escuela}          
            circuito={circuito}
            className="min-w-0"
          />

          {/* Mesa en chip aparte */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-1 text-[11px] whitespace-nowrap">
            <Table2 className="w-3.5 h-3.5 opacity-60" />
            <strong className="font-mono">{mesa ?? "—"}</strong>
          </span>

          <span className="inline-flex items-center gap-2 justify-self-end">
            {loadingText && (
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                {loadingText}
              </span>
            )}
            <UserAvatar size={28} color={avatarColor} />
          </span>
        </div>
      </div>

      <Separator className="mt-2" />
    </div>
  );
}
