// lib/validations/login.schema.ts
import { z } from "zod";


export const loginSchema = z.object({
    email: z
        .string()
        .nonempty("El email es obligatorio")
        .email("Formato de email inválido"),
    password: z
        .string()
        .nonempty("La contraseña es obligatoria")
        .min(6, "Mínimo 6 caracteres"),
});


export type LoginValues = z.infer<typeof loginSchema>;