// next.config.ts
import withPWA from "next-pwa";
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Reglas de cache:
 * - HTML (document): NO cachear => NetworkOnly
 * - /login: NO cachear => NetworkOnly
 * - /api/*: NO cachear => NetworkOnly
 * - _next/static: SWR
 * - Imágenes: CacheFirst
 */
const runtimeCaching: any[] = [
  // 1) No cachear HTML (evita que vuelva una página vieja desde el SW/bfcache)
  {
    urlPattern: ({ request }: any) => request.destination === "document",
    handler: "NetworkOnly",
  },
  // 2) No cachear el login explícitamente (por si alguna lib mete otra estrategia)
  {
    urlPattern: /\/login($|\?)/,
    handler: "NetworkOnly",
  },
  // 3) Nunca cachear APIs de auth/me/etc.
  {
    urlPattern: /\/api\/.*/i,
    handler: "NetworkOnly",
  },
  // 4) Estáticos de Next: OK con SWR
  {
    urlPattern: /\/_next\/static\/.*/i,
    handler: "StaleWhileRevalidate",
    options: { cacheName: "assets-cache" },
  },
  // 5) Imágenes
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
    handler: "CacheFirst",
    options: {
      cacheName: "images-cache",
      expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
    },
  },
];

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ui-avatars.com", pathname: "/api/**" },
      { protocol: "https", hostname: "**.ufs.sh", pathname: "/**" },
      { protocol: "https", hostname: "ufs.sh", pathname: "/**" },
    ],
  },
  // Headers de no-cache para /login (y para api mejor hacerlo en las rutas)
  async headers() {
    return [
      {
        source: "/login",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,   // toma control inmediato de la nueva versión
  disable: !isProd,    // desactiva PWA en dev
  runtimeCaching,
})(nextConfig);
