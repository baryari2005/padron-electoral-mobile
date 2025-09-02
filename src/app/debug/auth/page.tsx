// app/debug/auth/page.tsx
"use client";
import { useEffect, useState } from "react";

export default function DebugAuthPage() {
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/app-auth/me", { credentials: "include", cache: "no-store" });
      setStatus(res.status);
      const json = await res.json().catch(() => ({}));
      setData(json);
    })();
  }, []);

  return (
    <pre className="p-4 text-xs overflow-auto">
      STATUS: {status}
      {"\n"}
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
