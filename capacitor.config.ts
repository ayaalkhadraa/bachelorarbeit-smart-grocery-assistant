import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aya.freshflow.ionic',
  appName: 'FreshFlow Ionic',
  webDir: 'dist',
  plugins: {
    SystemBars: {
      hidden: false,
      insetsHandling: 'css',
      style: 'LIGHT'
    }
  }
};

export default config;
