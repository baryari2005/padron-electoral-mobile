// src/features/certificados/wizard/hooks/useWizardSteps.ts
import { useState } from "react";
import type { UseFormReturn, FieldPath } from "react-hook-form";
import type { CertificadoFormData } from "@/features/certificados/utils/schema/schema";

export function useWizardSteps(form: UseFormReturn<CertificadoFormData>, stepFields: Record<number, FieldPath<CertificadoFormData>[]>) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  const next = async () => {
    const fields = stepFields[step] ?? [];
    if (fields.length) {
      const ok = await form.trigger(fields, { shouldFocus: true });
      if (!ok) return;
    }
    setStep((s) => (s < 3 ? ((s + 1) as typeof s) : s));
  };

  const back = () => setStep((s) => (s > 0 ? ((s - 1) as typeof s) : s));

  return {
    step,
    setStep,
    next,
    back,
    isLast: step === 3,
    canBack: step > 0,
  };
}
