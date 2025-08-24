"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "@/lib/validations/login.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginForm() {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginValues) => {
    try {
      setLoading(true);
      const body = { identifier: data.email, password: data.password }; 
      const res = await fetch("/api/app-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Credenciales inválidas");
      // Ej: guardar token en storage/Zustand y redirigir
      // const { token } = await res.json();
      // setToken(token)
      window.location.href = "/"; // o dashboard
    } catch (e: any) {
      alert(e?.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh grid place-items-center p-4">
      <Card className="w-full max-w-sm p-6 shadow-xl rounded-2xl">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold">Ingresar</h1>
          <p className="text-sm text-muted-foreground">Votaciones 2025</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="text"
              inputMode="email"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="tu@correo.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                placeholder="•••••••"
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute inset-y-0 right-2 grid place-items-center"
                onClick={() => setShowPass((s) => !s)}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-2xl"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" /> Ingresar
              </span>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-4">
          ¿Olvidaste tu contraseña? Contactá al administrador
        </p>
      </Card>
    </div>
  );
}
