// src/features/certificados/wizard/components/SaveConfirmDialog.tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SaveConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Se detectaron inconsistencias</AlertDialogTitle>
          {/* ⚠️ Para evitar <p> dentro de <p>, usamos asChild y un <div> */}
          <AlertDialogDescription asChild>
            <div className="text-muted-foreground text-sm space-y-2">
              <p>
                El certificado presenta inconsistencias en los totales. Si continúa, el registro se guardará
                igualmente <strong>marcado con inconsistencias</strong>.
              </p>
              <p className="mt-2">¿Desea continuar?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Revisar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Guardar de todos modos</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
