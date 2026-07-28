import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ['./src/test/setup.ts'],
  },
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        popup: resolve(__dirname, 'popup.html'),
        review: resolve(__dirname, 'review.html'),
        vocabulary: resolve(__dirname, 'vocabulary.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
      },
    },
  },
})
