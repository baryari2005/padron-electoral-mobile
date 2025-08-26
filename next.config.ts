// next.config.ts
import withPWA from "next-pwa";
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const runtimeCaching: any[] = [
  { urlPattern: ({ request }: any) => request.destination === "document", handler: "NetworkFirst", options: { cacheName: "html-cache" } },
  { urlPattern: /\/_next\/static\/.*/i, handler: "StaleWhileRevalidate", options: { cacheName: "assets-cache" } },
  { urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i, handler: "CacheFirst", options: { cacheName: "images-cache", expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 } } },
  { urlPattern: /\/api\/.*/i, handler: "NetworkFirst", options: { cacheName: "api-cache", networkTimeoutSeconds: 5 } },
];

// 👇 Agregá esta sección:
const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [      
      // Avatares que ya usás
      { protocol: "https", hostname: "ui-avatars.com", pathname: "/api/**" },
      // Subdominios dinámicos de ufs.sh (ej: 1ypfpxokgs.ufs.sh)
      { protocol: "https", hostname: "**.ufs.sh", pathname: "/**" },
      // por si alguna vez viene sin subdominio
      { protocol: "https", hostname: "ufs.sh", pathname: "/**" },
    ],
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: !isProd,
  runtimeCaching,
})(nextConfig);
