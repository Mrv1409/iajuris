// next.config.ts
import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['http://localhost:3000', 'https://iajuris.vercel.app'],
    },
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // ⬅️ desativa no dev, ativa no build
})(nextConfig);
