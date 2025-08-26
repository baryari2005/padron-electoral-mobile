// src/components/auth/RequireAuth.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth"; // 👈 en vez de "stores/auth"
import { CommonLoader } from "@/components/common/CommonLoader";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuth((s) => s.token);
  const router = useRouter();

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  if (!token) {
    // opcional: spinner
    return (
      <div className="min-h-dvh grid place-items-center">
        <CommonLoader
          logo="/logo.png"
          alternativeLogo="/logo-white.png"
          alternativeText="Más San Miguel"
          title="Votaciones 2025"
          subTitle="San Miguel"
          loaderText="Cargando ..."
        />
      </div>
    );
  }
  return <>{children}</>;
}
