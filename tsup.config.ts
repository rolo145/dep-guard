import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["esm"],
  target: "node24",
  platform: "node",
  clean: true,
  sourcemap: true,
  dts: false,
  bundle: true,
  splitting: false,
  treeshake: true,
  minify: false,
  keepNames: true,
  shims: false,
  skipNodeModulesBundle: false,
  external: [],
  banner: {
    js: "#!/usr/bin/env node",
  },
});
