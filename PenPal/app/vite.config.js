import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    hmr: {
      host: "localhost",
    },
  },
  build: {
    outDir: path.resolve(__dirname, "./dist"),
    assetsDir: "assets",
    manifest: true,
    emptyOutDir: true,
    sourcemap: true,
  },
  root: "./src/client",
  base: "./",
  indexHtml: path.resolve(__dirname, "./src/client/index.html"),
  resolve: {
    alias: {
      "@penpal/core": path.resolve(__dirname, "./src/client/penpal/client.js"),
      "@penpal/common": path.resolve(__dirname, "./src/common/common.js"),
      "@penpal/plugins": path.resolve(
        __dirname,
        "./plugins/plugins-loader-client.js"
      ),
    },
    modules: [
      path.resolve(__dirname, "./src/client"),
      path.resolve(__dirname, "./src/common"),
      path.resolve(__dirname, "./plugins"),
    ],
  },
});
