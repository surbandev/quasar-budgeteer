import { defineConfig } from 'vitest/config'

// Backend API integration tests run in a Node environment and hit a real
// database (configured via backend/.env or BUDGETEER_ENV_FILE). They are kept
// separate from the jsdom front-end unit tests in vitest.config.js.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['backend/tests/**/*.{spec,test}.{js,cjs,mjs}'],
    globals: true,
    testTimeout: 30000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
})
