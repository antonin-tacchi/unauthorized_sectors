import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Three.js is very large (~1MB) — isolate it
          "vendor-three": ["three", "@react-three/fiber", "@react-three/drei"],
          // React core
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Animation libs
          "vendor-motion": ["framer-motion", "gsap"],
          // UI libs
          "vendor-ui": ["react-hot-toast", "react-icons", "react-compare-slider"],
          // Charts (admin only)
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
})
