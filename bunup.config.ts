import { defineConfig } from "bunup";
import { exports, unused } from "bunup/plugins";

export default defineConfig({
  entry: [
    "lib/index.ts",
    "lib/operators/index.ts",
    "lib/operators/basic/index.ts",
    "lib/operators/set/index.ts",
    "lib/operators/errors/index.ts",
    "lib/operators/utils/index.ts",
  ],
  format: ["cjs", "esm"],
  outDir: "dist",
  plugins: [exports(), unused()],
  minify: true,
  target: "node",
  dts: {
    splitting: true,
  },
});
