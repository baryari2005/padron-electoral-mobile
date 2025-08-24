"use client";
import { useEffect, useState } from "react";

export default function UpdateToast() {
  const [show, setShow] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // la página se recargará sola cuando el nuevo SW tome control
      window.location.reload();
    });

    navigator.serviceWorker.ready.then(reg => {
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            setWaiting(sw);
            setShow(true);
          }
        });
      });
    });
  }, []);

  const refresh = () => {
    waiting?.postMessage({ type: "SKIP_WAITING" });
  };

  if (!show) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-black/80 text-white px-4 py-2 shadow-lg">
      Nueva versión disponible.{" "}
      <button onClick={refresh} className="underline ml-2">Actualizar</button>
    </div>
  );
}
