import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/auth": "http://localhost:3001",
      "/events": "http://localhost:3001",
      "/participants": "http://localhost:3001",
      "/attendance": "http://localhost:3001",
      "/uploads": "http://localhost:3001",
    },
  },
});
