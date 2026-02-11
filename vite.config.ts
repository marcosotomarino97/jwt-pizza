import { defineConfig } from 'vite';
import istanbul from 'vite-plugin-istanbul';

// Instrument source code for NYC so Playwright browser tests can generate coverage.
export default defineConfig({
  build: { sourcemap: true },
  plugins: [
    istanbul({
      include: ['src/**/*'],
      exclude: ['node_modules', 'tests', 'playwright.config.*'],
      requireEnv: false,
    }),
  ],
});
