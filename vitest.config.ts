import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.config.{ts,js}',
      ],
    },
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url)),
      '#env': fileURLToPath(new URL('./src/env.ts', import.meta.url)),
      '#auth': fileURLToPath(new URL('./src/lib/auth.ts', import.meta.url)),
      '#auth/client': fileURLToPath(new URL('./src/lib/auth-client.ts', import.meta.url)),
      '#logger': fileURLToPath(new URL('./src/lib/logging.ts', import.meta.url)),
      '#flags': fileURLToPath(new URL('./src/lib/flags.ts', import.meta.url)),
    },
  },
});
