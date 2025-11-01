import { defineConfig } from "bunup";
import { exports, unused } from "bunup/plugins";

export default defineConfig({
  entry: "lib/index.ts",
  format: ["cjs", "esm"],
  outDir: "dist",
  plugins: [exports(), unused()],
  minify: true,
  target: "node",
});
