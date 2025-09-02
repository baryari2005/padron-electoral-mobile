// src/components/auth/RequireAuth.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

export function RequireAuth2({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hasHydrated, loading, triedMe, fetchUser } = useAuthStore();

  useEffect(() => {
    // log de montaje
    console.log("[Guard] mount on", pathname, { hasHydrated, loading, triedMe, user: !!user });
  }, []);

  // Dispará /me UNA sola vez cuando hidrató
  useEffect(() => {
    if (!hasHydrated) return;
    if (!triedMe) {
      console.log("[Guard] llamo fetchUser()");
      fetchUser();
    } else {
      console.log("[Guard] ya probamos /me → triedMe:", triedMe, "user:", !!user);
    }
  }, [hasHydrated, triedMe, fetchUser, user]);

  // No decidas nada hasta tener veredicto
  if (!hasHydrated || loading || !triedMe) {
    console.log("[Guard] esperando…", { hasHydrated, loading, triedMe });
    return null;
  }

  // Sin user → a login
  if (!user) {
    console.log("[Guard] SIN user → /login");
    router.replace("/login");
    return null;
  }

  // Sin escuelas → a sin-escuela
  const escuelas = Array.isArray(user.escuelas) ? user.escuelas : [];
  if (escuelas.length === 0) {
    console.log("[Guard] user sin escuelas → /sin-escuela");
    router.replace("/sin-escuela");
    return null;
  }

  console.log("[Guard] OK, renderizo children");
  return <>{children}</>;
}
