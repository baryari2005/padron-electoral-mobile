// src/app/components/InstallPrompt.tsx
"use client";
import { useEffect, useState } from "react";

const HIDE_KEY = "hideInstallPrompt";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(HIDE_KEY) === "true") return;

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
    if (choice.outcome !== "accepted") {
      setVisible(false);
      localStorage.setItem(HIDE_KEY, "true");
    }
  };

  const close = () => {
    setVisible(false);
    localStorage.setItem(HIDE_KEY, "true");
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white px-4 py-2 rounded-xl shadow">
      <span>Instalá la app en tu dispositivo</span>
      <button onClick={install} className="underline ml-3">Instalar</button>
      <button onClick={close} className="ml-3 opacity-80">✕</button>
    </div>
  );
}
