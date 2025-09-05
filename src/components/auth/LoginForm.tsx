"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "@/lib/validations/login.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Logo } from "app/components/Logo";
import { useAuth } from "@/stores/auth";

const DEBUG_AUTH = false;
const dlog = (...args: any[]) => { if (DEBUG_AUTH) console.log("[AUTH]", ...args); };

const LOGIN_URL = "/api/app-auth/login";
const ME_URL    = "/api/app-auth/me";

type EscuelaLite = { id?: string | number; nombre?: string } | null | undefined;
type UsuarioEstablecimientoLite = {
  principal?: boolean;
  establecimiento?: EscuelaLite;
  escuela?: EscuelaLite;
  establecimientoId?: number | string;
  escuelaId?: number | string;
};

function toNum(n: unknown): number | null {
  if (n === null || n === undefined) return null;
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

function extractEscuelaFromUser(user: any) {
  const candidates: Array<any[] | undefined> = [
    user?.escuelas,
    user?.usuario?.escuelas,
    user?.usuarioEstablecimientos,
    user?.usuariosEscuelas,
    user?.establecimientos,
    user?.profile?.escuelas,
  ];

  for (const arr of candidates) {
    if (Array.isArray(arr) && arr.length > 0) {
      const chosen = (arr.find((x: any) => x?.principal) ?? arr[0]) as UsuarioEstablecimientoLite;
      const escuelaObj: any = chosen?.establecimiento ?? chosen?.escuela ?? null;
      const escuelaIdRaw =
        chosen?.establecimientoId ??
        chosen?.escuelaId ??
        (escuelaObj as any)?.id ??
        null;

      return {
        escuelaId: toNum(escuelaIdRaw),
        escuelaObj: escuelaObj ?? null,
      };
    }
  }
  return { escuelaId: null, escuelaObj: null };
}

export default function LoginForm() {
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

  const onSubmit = async (data: LoginValues) => {
    setFormError(null);
    try {
      dlog("POST", LOGIN_URL, { identifier: data.email });

      // 🔒 Login
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ identifier: data.email, password: data.password }),
        cache: "no-store",
        credentials: "include", // 🔧 por si en algún caso no es same-origin
      });

      const loginJson = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(loginJson?.error ?? `HTTP ${res.status}`);

      let user = loginJson?.user;
      const token: string | undefined = loginJson?.token;

      // Primero, intentar con lo que vino del login
      let extra = extractEscuelaFromUser(user);

      // Si no viene escuela, refrescar contra /me
      if (!extra.escuelaId && token) {
        const meRes = await fetch(ME_URL, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          cache: "no-store",
          credentials: "include",
        });
        const meJson = await meRes.json().catch(() => ({}));
        if (!meRes.ok) throw new Error(meJson?.error ?? `HTTP ${meRes.status} en /api/app-auth/me`);
        user = meJson?.user ?? user;
        extra = extractEscuelaFromUser(user);
      }

      if (!extra.escuelaId) {
        setFormError("Tu usuario no posee una escuela asignada. Contactá a un administrador.");
        return;
      }

      // ✅ Guardar sesión *del usuario actual* (ideal: que setSession limpie estado previo)
      if (token) {
        setSession(token, {
          ...user,
          escuelaId: extra.escuelaId,   // <- explícito para el store
          escuela: extra.escuelaObj ?? undefined,
        });
      }

      // ✅ Navegar y forzar re-render con nuevas cookies/estado
      router.replace("/certificados/nuevo");
      router.refresh(); // 🔑 evita que quede caché del usuario anterior
    } catch (e: any) {
      setFormError(e?.message ?? "Error al iniciar sesión");
      dlog("Login error:", e);
    }
  };

  return (
    <div className="min-h-dvh flex items-start sm:items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50 to-white">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md flex flex-col items-center space-y-6"
        >
          <Logo />
          <div className="text-center">
            <h1 className="text-3xl my-2 font-bold">Bienvenido al dashboard de elecciones provinciales 2025.</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 w-full">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter">Iniciar sesión.</h2>
              <p className="text-muted-foreground">Ingresá tus credenciales para acceder a tu cuenta.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">Usuario o Correo electrónico</Label>
                <Input
                  id="email"
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  enterKeyHint="next"
                  placeholder="user123 o test@ejemplo.com"
                  className="h-11"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    enterKeyHint="go"
                    placeholder="••••••••"
                    className="h-11 pr-10"
                    {...register("password")}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
              </div>

              {formError && (
                <p className="text-sm text-red-600 whitespace-pre-wrap" role="alert">
                  {formError}
                </p>
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold disabled:opacity-100 disabled:bg-muted disabled:text-muted-foreground disabled:hover:bg-muted"
                disabled={isSubmitting || !isValid}
                aria-disabled={isSubmitting || !isValid}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Ingresando…
                  </span>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
