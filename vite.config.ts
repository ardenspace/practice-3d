import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// dev/preview run on Vite's default port 5173 — do not move onto this
// machine's occupied ports (8080/8000/8081/5000/7000).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
