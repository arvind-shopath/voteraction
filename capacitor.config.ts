import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.creatiav.voteraction',
  appName: 'Voteraction',
  webDir: 'out',
  server: {
    url: 'https://voteraction.creatiav.com',
    cleartext: true
  }
};

export default config;
