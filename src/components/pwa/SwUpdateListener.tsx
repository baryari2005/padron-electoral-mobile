// src/components/pwa/SwUpdateListener.tsx
"use client";
import { useEffect } from "react";

export default function SwUpdateListener() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onControllerChange = () => {
      // Cuando el nuevo SW toma control, recargamos la app
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
