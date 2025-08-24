import { z } from "zod";

export const resultadoSchema = z.object({
  // Usamos string porque los cargos vienen de API y pueden variar (p. ej. "DIPUTADOS", "SENADORES", etc.)
  categoria: z.string().min(1, "Seleccioná un cargo"),
  agrupacionId: z.string().min(1, "Seleccioná agrupación"),
  votos: z.coerce.number().int().min(0, "Debe ser ≥ 0"),
});

export const votosEspecialesSchema = z.object({
  nulos: z.coerce.number().int().min(0).default(0),
  enBlanco: z.coerce.number().int().min(0).default(0),
  recurridos: z.coerce.number().int().min(0).default(0),
  impugnados: z.coerce.number().int().min(0).default(0),
});

export const certificadoSchema = z.object({
  establecimientoId: z.string().min(1, "Requerido"),
  numeroMesa: z.coerce.number().int().min(1, "Debe ser ≥ 1"),
  resultados: z.array(resultadoSchema).min(1, "Agregá al menos un resultado"),
  votosEspeciales: votosEspecialesSchema,
});

// 👇 Usamos el OUTPUT para que los números coaccionados queden tipados como number
export type CertificadoFormData = z.output<typeof certificadoSchema>;
