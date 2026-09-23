import { execSync } from 'node:child_process';
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

function appSha(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_SHA__: JSON.stringify(appSha()),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
