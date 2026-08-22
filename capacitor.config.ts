import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.creatiav.voteraction',
  appName: 'Voteraction',
  webDir: 'out',
  server: {
    url: 'https://voteraction.thefreelance.in',
    cleartext: true
  }
};

export default config;
