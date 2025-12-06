import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { UserConfig } from "vite";

export default defineConfig(({}) => ({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    hmr: {
      host: "localhost",
    },
    watch: {
      usePolling: true,
    },
    sourcemap: true,
  },
  build: {
    outDir: path.resolve(__dirname, "./dist"),
    assetsDir: "assets",
    manifest: true,
    emptyOutDir: true,
    sourcemap: true,
  },
  root: "./src/",
  base: "./",
  indexHtml: path.resolve(__dirname, "./src/index.html"),
  resolve: {
    alias: {
      "@penpal/core": path.resolve(__dirname, "./src/penpal/client.ts"),
      "@penpal/common": path.resolve(__dirname, "./src/common/common.ts"),
      "@penpal/plugins": "./plugins/plugins-loader-client.ts",
      "@penpal/types": path.resolve(__dirname, "./src/types.d.ts"),
    },
    modules: [
      path.resolve(__dirname, "./src"),
      path.resolve(__dirname, "./plugins"),
    ],
  },
})) as UserConfig;
