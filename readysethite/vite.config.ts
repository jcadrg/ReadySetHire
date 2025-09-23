import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // optional dev proxy to avoid CORS while developing
    proxy: {
      "/api": {
        target: "https://comp2140a2.uqcloud.net",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});