import { defineConfig } from 'vite'
import istanbul from 'vite-plugin-istanbul'

export default defineConfig(() => {
  const enableCoverage = process.env.COVERAGE === 'true'

  return {
    build: {
      sourcemap: enableCoverage,
    },
    plugins: enableCoverage
      ? [
          istanbul({
            include: ['src/**'],
            exclude: ['node_modules', 'tests', 'playwright.config.*'],
            requireEnv: false,
          }),
        ]
      : [],
  }
})