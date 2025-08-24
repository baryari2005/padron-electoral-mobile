// src/app/components/ConditionalInstallPrompt.tsx
"use client";

import { usePathname } from "next/navigation";
import InstallPrompt from "./InstallPrompt";

export default function ConditionalInstallPrompt() {
  const pathname = usePathname();
  return pathname === "/app-auth/login" ? <InstallPrompt /> : null;
}
