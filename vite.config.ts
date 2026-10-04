import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import aitDevtools from '@apps-in-toss/devtools/unplugin';

export default defineConfig(({ mode }) => ({
  plugins: [...(mode === 'toss' ? [aitDevtools.vite()] : []), react()],
  server: { host: '0.0.0.0', port: 5173, strictPort: true },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
}));
