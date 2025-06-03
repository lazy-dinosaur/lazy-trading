import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// 영어 버전 빌드를 위한 vite 설정
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      ccxt: "node_modules/ccxt/dist/cjs/ccxt.js",
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist_en',
  },
  define: {
    'process.env.VITE_APP_LANGUAGE': JSON.stringify('en')
  },
  server: {
    proxy: {
      "/api": {
        target: "https://api.bitget.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
