import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { webcrypto } from "node:crypto";
import { VitePWA } from "vite-plugin-pwa";

// Some transitive tooling (for example workbox dependencies used by vite-plugin-pwa)
// expects Web Crypto's getRandomValues during node-side startup.
// Ensure it's available in the dev server runtime.
if (!(globalThis as { crypto?: { getRandomValues?: unknown } }).crypto?.getRandomValues) {
  (globalThis as { crypto?: unknown }).crypto = webcrypto;
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
      },
      manifest: {
        name: "WealthWise – Personal Finance",
        short_name: "WealthWise",
        description: "Track expenses, get AI insights, and grow your wealth",
        theme_color: "#0e2726",
        background_color: "#080f1a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/favicon.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon",
          },
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
