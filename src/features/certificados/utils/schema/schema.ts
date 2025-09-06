import { z } from "zod";

// Subschemas
const mesaSchema = z.object({
  escuelaId: z.string().min(1, "Seleccioná una escuela"),
  numeroMesa: z
    .string()
    .min(1, "Ingresá el número de mesa")
    .refine(
      (v) => {
        const num = Number(v);
        return !isNaN(num) && num > 0;
      },
      {
        message: "Debe ser un número mayor a 0",
      }
    ),
  circuitoId: z.string().min(1, "Seleccioná un circuito"),
});

const votosPorColumna = z.object({
  // nulos: z.number().min(0),
  // recurridos: z.number().min(0),
  impugnados: z.number().min(0),
  // comandoElectoral: z.number().min(0),
  blancos: z.number().min(0),
});

const totalesSchema = z.object({
  sobres: z.number().min(1, "Debe ser mayor a 1."),
  votantes: z.number().min(1, "Debe ser mayor a 1."),
  diferencia: z.number(), // puede ser negativa
});

const resultadoPorCargoSchema = z
  .object({
    numero: z.number(),
    nombre: z.string(),
    profileImage: z.string(),
  })
  .catchall(z.number().min(0)); // para permitir { '1': number, '4': number }

const votosEspecialesSchema = z.record(z.string(), votosPorColumna); // ✅ CORRECTO

export const certificadoSchema = z.object({
  mesa: mesaSchema,
  totales: totalesSchema,
  votosEspeciales: votosEspecialesSchema, // ✅ ahora es un record por categoria
  resultadosPresidenciales: z.array(resultadoPorCargoSchema),
});

export type CertificadoFormData = z.infer<typeof certificadoSchema>;
