// src/app/(dashboard)/layout.tsx
"use client";

import RequireAuth from "@/app.components/auth/RequireAuth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
