import { defineConfig } from "vite";
import wgsl from "@vgpu/wgsl/loader-vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// Builds the isolated hero into a single self-contained ESM file committed at
// ../../js/daylight-spectrum.js. vgpu (~25KB gz) is inlined so the output stays
// a plain static asset with no bare imports, safe for GitHub Pages.
export default defineConfig({
  plugins: [wgsl({ minify: true })],
  build: {
    target: "es2022",
    outDir: resolve(here, "../../js"),
    emptyOutDir: false,
    lib: {
      entry: resolve(here, "src/main.ts"),
      formats: ["es"],
      fileName: () => "daylight-spectrum.js",
    },
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
    minify: "esbuild",
  },
});
