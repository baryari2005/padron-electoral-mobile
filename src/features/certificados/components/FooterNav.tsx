// src/features/certificados/components/FooterNav.tsx
"use client";

import { Button } from "@/components/ui/button";

type Props = {
  canBack: boolean;
  isLast: boolean;
  saving: boolean;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
};

export default function FooterNav({ canBack, isLast, saving, onBack, onNext, onSave }: Props) {
  return (
    <footer
      className="sticky bottom-0 bg-background/90 backdrop-blur px-4 py-3"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <div className="flex gap-2">
        {canBack && (
          <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
            Atrás
          </Button>
        )}
        {isLast ? (
          <Button type="button" className="flex-1" onClick={onSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        ) : (
          <Button type="button" className="flex-1" onClick={onNext} disabled={saving}>
            Siguiente
          </Button>
        )}
      </div>
    </footer>
  );
}
