// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: { extend: {} },
  darkMode: "class",            // ← no usar ["class"]
} satisfies Config;
