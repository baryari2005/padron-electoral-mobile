import { Loader2 } from "lucide-react";

type Variant = "inline" | "container" | "page" | "fullscreen";
type LabelSize = "text-xs" | "text-sm" | "text-base" | "text-lg" | "text-xl";

interface Props {
  label?: string;
  variant?: Variant;
  /** Solo para variant="page". Ej: "80vh" o "calc(100vh - 64px)" */
  pageMinHeight?: string;
  className?: string;
  labelSize?: string;
}

export function Cargando({
  label = "Cargando...",
  variant = "inline",
  pageMinHeight = "80vh",
  className = "",
  labelSize = "text-lg"
}: Props) {
  const base = "grid place-items-center";
  const classes =
    variant === "fullscreen"
      ? `${base} fixed inset-0 bg-background/60 backdrop-blur-sm z-50`
      : variant === "container"
        ? `${base} w-full h-full`
        : variant === "page"
          ? `${base}` // la altura la doy con style para no pelear con Tailwind
          : `${base}`;

  return (
    <div
      className={`${classes} ${className}`}
      style={variant === "page" ? { minHeight: pageMinHeight } : undefined}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className={`${labelSize} font-medium text-muted-foreground animate-pulse`}>
          {label}
        </span>
      </div>
    </div>
  );
}
