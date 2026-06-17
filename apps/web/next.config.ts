import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sitepulse/ui', '@sitepulse/shared', '@sitepulse/trpc'],
  typedRoutes: true,
};

export default nextConfig;
