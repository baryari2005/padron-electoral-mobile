import type { FieldPath } from "react-hook-form";
import type { CertificadoFormData } from "@/features/certificados/utils/schema/schema";

export const STEPS = [
    "Mesa y Totales",
    "Votos por Agrupaciones",
    "Votos especiales",
    "Resumen y Guardado",
] as const;

export const STEP_FIELDS: Record<number, FieldPath<CertificadoFormData>[]> = {
    0: ["mesa.escuelaId", "mesa.numeroMesa", "totales.sobres", "totales.votantes"],
    1: [],
    2: [],
};