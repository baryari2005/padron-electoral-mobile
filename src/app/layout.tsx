// src/app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import UpdateToast from "./components/UpdateToast";
import SwUpdateListener from "@/components/pwa/SwUpdateListener";
import ConditionalInstallPrompt from "./components/ConditionalInstallPrompt";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0ea5e9" />

        {/* iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Votos 2025" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180.png" />
      </head>
      <body className={`${inter.className} bg-background text-foreground`}>
        {/* Solo en /app-auth/login */}
        <ConditionalInstallPrompt />

        <UpdateToast />
        <SwUpdateListener />
        {children}
      </body>
    </html>
  );
}
