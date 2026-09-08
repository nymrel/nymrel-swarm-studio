import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/mock/**/*.ts'],
      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
        branches: 80,
      },
    },
  },
});
