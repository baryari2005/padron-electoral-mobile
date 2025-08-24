// app/layout.tsx
import SwUpdateListener from "@/components/pwa/SwUpdateListener";
import "./globals.css";            // 👈 IMPORTANTE
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Votos 2025" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
      </head>
      <body className={inter.className + " bg-background text-foreground"}>
                <SwUpdateListener />
        {children}
      </body>
    </html>
  );
}
