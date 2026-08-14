import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      host: true,
      port: 8000,
      allowedHosts: [
        "math-buddy-2xsw.onrender.com",
        ".onrender.com"
      ]
    },
    preview: {
      allowedHosts: [
        "math-buddy-2xsw.onrender.com",
        ".onrender.com"
      ]
    }
  }
});