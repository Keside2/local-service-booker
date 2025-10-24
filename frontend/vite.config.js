import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
  build: {
    outDir: "dist",
  },
  publicDir: "public", // 👈 ensures files like _redirects are included
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
