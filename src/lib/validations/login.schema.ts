// lib/validations/login.schema.ts
import { z } from "zod";


export const loginSchema = z.object({
    email: z.string().min(1, "El usuario o email es requerido."),
    password: z
        .string()
        .nonempty("La contraseña es obligatoria")
        .min(6, "Mínimo 6 caracteres"),
});


export type LoginValues = z.infer<typeof loginSchema>;