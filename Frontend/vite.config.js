import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin: inject LCP hero preload + remove Three.js modulepreload (lazy-loaded only on ProjectDetails)
function performancePlugin() {
  let heroAssetUrl = null
  return {
    name: 'performance-plugin',
    generateBundle(_, bundle) {
      for (const [fileName] of Object.entries(bundle)) {
        if (fileName.includes('HeroPortfolio') && fileName.endsWith('.webp')) {
          heroAssetUrl = `/${fileName}`
        }
      }
    },
    transformIndexHtml(html) {
      // Remove Three.js modulepreload — it's lazy-loaded only on /projects/:slug
      let result = html.replace(
        /<link rel="modulepreload" crossorigin href="[^"]*vendor-three[^"]*">\s*\n?/,
        ''
      )
      // Inject hero image preload
      if (heroAssetUrl) {
        const tag = `  <link rel="preload" as="image" href="${heroAssetUrl}" type="image/webp" fetchpriority="high">\n`
        result = result.replace('</head>', `${tag}</head>`)
      }
      return result
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), performancePlugin()],
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
