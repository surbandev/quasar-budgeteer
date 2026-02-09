import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    include: ['src/tests/**/*.{spec,test}.{js,mjs,cjs,ts,mts,cts,vue}'],
    exclude: ['node_modules', 'dist', '.quasar'],
    globals: true,
  },
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
