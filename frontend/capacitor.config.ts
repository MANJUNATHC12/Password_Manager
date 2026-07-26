import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.passwordmanager',
  appName: 'Password Manager',
  webDir: 'dist',
  server: {
    // ─── Change this to your hosted server URL after deploying ───
    // url: 'http://YOUR_SERVER_IP:3000',
    // androidScheme: 'http',
    cleartext: true, // allow HTTP (set to false when using HTTPS)
  },
  android: {
    allowMixedContent: true, // allow HTTP API calls from HTTPS app
  },
};

export default config;
