// src/components/auth/SessionResetOnLoad.tsx
"use client";
import { useEffect } from "react";

export default function SessionResetOnLoad() {
  useEffect(() => {
    if (!sessionStorage.getItem("session_opened")) {
      try {
        localStorage.removeItem("token");
        sessionStorage.clear();
      } catch {}
      fetch("/api/app-auth/logout", { method: "POST" }).catch(() => {});
      sessionStorage.setItem("session_opened", "1");
      const onHide = () => sessionStorage.removeItem("session_opened");
      window.addEventListener("pagehide", onHide, { once: true });
    }
  }, []);
  return null;
}
