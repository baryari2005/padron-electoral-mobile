// src/components/auth/LoginForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import { Logo } from "@/app/components/Logo";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function SinEscuelaPage() {
  return (
    <div className="min-h-dvh flex items-start sm:items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50 to-white">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md flex flex-col items-center space-y-6">
          <Logo />
          <div className="text-center">
            <h1 className="text-3xl my-2 font-bold">Bienvenido al dashboard de Elecciones Provinciales.</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 w-full">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter">No dispones de escuelas asignadas.</h2>
              <Separator />
              <p className="text-muted-foreground">
                Tu usuario no tiene establecimientos asociados. Solicitar a un administrador que le asigne uno para poder cargar el certificado de escrutinio.</p>
            </div>

            <Button asChild className="mt-10 w-full h-11 rounded-xl font-semibold">
              <Link href="/login">Volver</Link>
            </Button>            
          </div>
        </motion.div>
      </div>
    </div>
  );
}
