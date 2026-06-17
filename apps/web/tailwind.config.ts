import type { Config } from 'tailwindcss';
import { sitepulsePreset } from '@sitepulse/tailwind-config';

const config: Config = {
  presets: [sitepulsePreset as Config],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
