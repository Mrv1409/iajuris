declare module 'next-pwa' {
    import { NextConfig } from 'next';
    type PWAOptions = {
      dest: string;
      register?: boolean;
      skipWaiting?: boolean;
      disable?: boolean;
    };
  
    const withPWA: (options: PWAOptions) => (config: NextConfig) => NextConfig;
    export default withPWA;
  }
  