import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tu.app',
  appName: 'TuApp',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  // 👇 AGREGA ESTO AQUÍ 👇
  plugins: {
    Keyboard: {
      resize: 'body',       // Esto empuja la vista hacia arriba
      style: 'dark',
      scrollToBottomOnFocus: true, // Ayuda a mantener el foco visible
    },
  },
};

export default config;
