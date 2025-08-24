// src/app/components/UpdateToast.tsx
"use client";
import { useEffect, useState } from "react";

export default function UpdateToast() {
  const [show, setShow] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // cuando el nuevo SW toma control, recargamos
    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker.ready.then((reg) => {
      // si ya hay uno en espera
      if (reg.waiting) {
        setWaiting(reg.waiting);
        setShow(true);
      }

      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            // hay una nueva versión en espera
            setWaiting(reg.waiting || null);
            setShow(true);
          }
        });
      });
    });

    // cleanup
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const refresh = () => {
    // le pedimos al SW que haga skipWaiting
    waiting?.postMessage({ type: "SKIP_WAITING" });
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-black/80 text-white px-4 py-2 shadow-lg">
      Nueva versión disponible.
      <button onClick={refresh} className="underline ml-2">Actualizar</button>
    </div>
  );
}
