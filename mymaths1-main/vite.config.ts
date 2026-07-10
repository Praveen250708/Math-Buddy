import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      host: true,
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