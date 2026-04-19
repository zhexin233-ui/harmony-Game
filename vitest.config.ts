import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/.git/**', '.worktrees/**', '**/unpackage/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['stores/**/*.ts', 'theme/**/*.ts', 'native/**/*.ts', 'games/**/*.ts', 'utils/**/*.ts'],
      exclude: ['**/*.uvue', '**/main.ts']
    }
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') }
  }
})
