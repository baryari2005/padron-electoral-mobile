"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome !== "accepted") setVisible(false);
  };

  // iOS: detectar y mostrar tip
  const isIOS = typeof window !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

  if (!visible && !isIOS) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white px-4 py-2 rounded-xl">
      {isIOS ? (
        <span>En iPhone: Compartir → <b>Agregar a pantalla de inicio</b> 📲</span>
      ) : (
        <>
          <span>Instalá la app en tu dispositivo</span>
          <button onClick={install} className="underline ml-2">Instalar</button>
        </>
      )}
    </div>
  );
}
