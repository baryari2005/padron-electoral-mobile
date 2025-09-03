"use client";

import Image from "next/image";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth";

type Tone = "muted" | "primary" | "emerald" | "sky" | "rose";

const toneClasses: Record<Tone, string> = {
  muted: "bg-muted text-foreground/80 ring-border",
  primary: "bg-primary text-primary-foreground ring-primary/30",
  emerald: "bg-emerald-600 text-white ring-emerald-300/50",
  sky: "bg-sky-600 text-white ring-sky-300/50",
  rose: "bg-rose-600 text-white ring-rose-300/50",
};

type Props = {
  size?: number;
  className?: string;
  showName?: boolean;
  color?: Tone; // 👈 elegí el tono
};

export default function UserAvatar({ size = 28, className, showName = false, color = "primary" }: Props) {
  const user = useAuth((s) => s.user);

  const initials = useMemo(() => {
    const s = ([user?.nombre, user?.apellido].filter(Boolean).join(" ") || user?.email || "").trim();

    if (!s) return "U";
    const [a = "", b = ""] = s.split(/\s+/);
    return (a[0] + (b[0] || "") || a[0]).toUpperCase();
  }, [user]);

  const title = user?.nombre || user?.email || "Usuario";
  const tone = toneClasses[color];

  return (
    <div className={cn("inline-flex items-center gap-2", className)} title={title}>
      <div
        className={cn("rounded-full grid place-items-center overflow-hidden ring-1", tone)}
        style={{ width: size, height: size }}
        aria-label={`Usuario: ${title}`}
      >
        {user?.avatarUrl ? (
          <Image src={user.avatarUrl} alt={title} width={size} height={size} className="object-cover" />
        ) : (
          <span className="text-[10px] font-semibold select-none">{initials}</span>
        )}
      </div>
      {showName && <span className="text-xs font-medium max-w-[16ch] truncate">{title}</span>}
    </div>
  );
}
