import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  deps: {
    neverBundle: ['@nisoku/sazami'],
    alwaysBundle: ['@nisoku/satori'],
  },
  target: false,
});
