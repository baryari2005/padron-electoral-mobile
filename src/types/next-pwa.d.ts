declare module 'next-pwa' {
  import type { NextConfig } from 'next';

  type WithPWAOptions = {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    runtimeCaching?: any[];
    buildExcludes?: string[];
  };

  const withPWA: (options?: WithPWAOptions) =>
    (nextConfig?: NextConfig) => NextConfig;

  export default withPWA;
}