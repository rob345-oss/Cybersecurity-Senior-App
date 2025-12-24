import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/titanium-192.png", "icons/titanium-512.png"],
      manifest: {
        name: "Titanium Guardian",
        short_name: "TitaniumGuard",
        description: "Cross-platform security companion for CallGuard, MoneyGuard, InboxGuard, and IdentityWatch.",
        theme_color: "#0f172a",
        background_color: "#0b1120",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/titanium-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/titanium-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});
