import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pharmapulse.app',
  appName: 'PharmaPulse',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;