import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Only include visualizer in development and not on Vercel
    ...(mode === 'development' && process.env.VERCEL !== '1' ? [visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })] : [])
  ],
  build: {
    // Production optimizations
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          motion: ['framer-motion'],
          query: ['@tanstack/react-query'],
          auth: ['@auth0/auth0-react'],
          monitoring: ['@sentry/react'],
          utils: ['react-swipeable', 'lucide-react']
        },
        // Optimize asset naming for caching
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    // Disable source maps in production for security
    sourcemap: mode === 'development',
    // Optimize chunk size
    chunkSizeWarningLimit: 500,
    // Enable CSS code splitting
    cssCodeSplit: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion']
  },
  // Development server configuration
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Preview server configuration (for production builds)
  preview: {
    host: true,
    port: 4173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Environment variables
   define: {
     __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
   }
 }));