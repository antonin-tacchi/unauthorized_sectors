import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin: inject <link rel="preload"> for the LCP hero image after build
function preloadHeroPlugin() {
  let heroAssetUrl = null
  return {
    name: 'preload-hero',
    generateBundle(_, bundle) {
      for (const [fileName] of Object.entries(bundle)) {
        if (fileName.includes('HeroPortfolio') && fileName.endsWith('.webp')) {
          heroAssetUrl = `/${fileName}`
        }
      }
    },
    transformIndexHtml(html) {
      if (!heroAssetUrl) return html
      const tag = `  <link rel="preload" as="image" href="${heroAssetUrl}" type="image/webp" fetchpriority="high">\n`
      return html.replace('</head>', `${tag}</head>`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), preloadHeroPlugin()],
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
