import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/chat": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(process.env.VITE_API_URL || ""),
  },
}); 