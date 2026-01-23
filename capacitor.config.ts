import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.genesis.admin',
  appName: 'Genesis Admin',
  webDir: 'dist',
  server: {
    // La app abre directamente en /auth (login)
    url: undefined,
  }
};

export default config;
