// src/components/auth/LoginForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "@/lib/validations/login.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { useAuth } from "stores/auth";               // tu store en memoria (si la usás)
import { Logo } from "@/app/components/Logo";
import { useAuthStore } from "@/stores/useAuthStore";

export default function LoginForm() {
  useEffect(() => {
    try {
      // limpiar stores locales que puedan “enganchar” el usuario anterior
      localStorage.removeItem("auth-store");
      localStorage.removeItem("token");
      // si tu store tiene reset:
      useAuthStore.getState().reset?.();
    } catch { }

    // Safari Back-Forward Cache: si vuelve cacheado, forzar reload
    const onShow = (e: PageTransitionEvent) => {
      // @ts-ignore
      if (e.persisted) location.reload();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (formData: LoginValues) => {
    setFormError(null);
    try {
      console.log("[login] enviando credenciales…");
      const res = await fetch("/api/app-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: formData.email, password: formData.password }),
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      console.log("[login] status:", res.status, "json:", json);

      if (!res.ok) throw new Error(json?.error ?? "Credenciales inválidas");

      // Guarda sesión en memoria si la usás
      if (json?.token) setSession(json.token, json.user);

      // 🔴 AHORA SÍ: llamamos a /api/app-auth/me (GET) para traernos el usuario "completo"
      console.log("[me] llamando a /api/app-auth/me …");
      const meRes = await fetch("/api/app-auth/me", { method: "GET", cache: "no-store" });
      const meJson = await meRes.json().catch(() => ({}));
      console.log("[me] status:", meRes.status, "json:", meJson);

      if (!meRes.ok) {
        // Algo pasó con el token/cookie → volvemos al login con mensaje
        throw new Error(meJson?.error ?? "No se pudo obtener /me");
      }

      const escuelas = meJson?.user?.escuelas ?? [];
      if (Array.isArray(escuelas) && escuelas.length > 0) {
        console.log("[me] usuario con escuelas:", escuelas.length);
        router.replace("/certificados/nuevo");
      } else {
        console.log("[me] usuario SIN escuelas asociadas");
        router.replace("/sin-escuela");
      }
    } catch (e: any) {
      console.error("[login] error:", e);
      setFormError(e?.message ?? "Error al iniciar sesión");
    }
  };

  return (
    <div className="min-h-dvh flex items-start sm:items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50 to-white">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md flex flex-col items-center space-y-6">
          <Logo />
          <div className="text-center">
            <h1 className="text-3xl my-2 font-bold">Carga certificado escrutinio. Elecciones Provinciales.</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 w-full">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter">Iniciar sesión.</h2>
              <p className="text-muted-foreground">Ingresá tus credenciales para acceder a tu cuenta.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">Usuario o Correo electrónico</Label>
                <Input id="email" type="text" inputMode="email" autoComplete="username" enterKeyHint="next" placeholder="user123 o test@ejemplo.com" className="h-11" {...register("email")} aria-invalid={!!errors.email} />
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" enterKeyHint="go" placeholder="••••••••" className="h-11 pr-10" {...register("password")} aria-invalid={!!errors.password} />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
              </div>

              {formError && <p className="text-sm text-red-600" role="alert">{formError}</p>}

              <Button type="submit" className="w-full h-11 rounded-xl font-semibold disabled:opacity-100 disabled:bg-muted disabled:text-muted-foreground disabled:hover:bg-muted" disabled={isSubmitting || !isValid} aria-disabled={isSubmitting || !isValid}>
                {isSubmitting ? (<span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Ingresando…</span>) : ("Iniciar sesión")}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
