import { defineConfig } from 'vitest/config';
import path from 'path';
export default defineConfig({
  test: { environment: 'node', include: ['bench/*.bench.ts'], testTimeout: 1_800_000 },
  resolve: { alias: { '@': path.resolve(__dirname, '../') } },
});
