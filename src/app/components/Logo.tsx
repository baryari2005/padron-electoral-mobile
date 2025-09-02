"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

function capitalizeEachWord(str: string) {
  return str
    .toLowerCase()
    .replace(/\b\p{L}/gu, (m) => m.toUpperCase());
}

export function Logo() {
  const router = useRouter();
  const { theme } = useTheme();

  const logoSrc = theme === "dark" ? "/logo-white.png" : "/logo.png";

  return (
    <div
      role="link"
      aria-label="Ir al inicio"
      className="min-h-20 h-20 inline-flex items-center cursor-pointer gap-3 border-b border-gray-200 dark:border-gray-800"
      onClick={() => router.push("/")}
    >
      <Image src={logoSrc} alt="Logo" width={50} height={50} className="rounded-lg" priority />
      <div className="flex flex-col leading-tight ml-4">
        <h1 className="font-bold text-xl">
          {capitalizeEachWord("Elecciones Provinciales")}
        </h1>
        <h2 className="text-sm text-center">{capitalizeEachWord("San Miguel 2025")}</h2>
      </div>
    </div>
  );
}
