import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [react()]

  if (mode === 'development') {
    // Use require to avoid async
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { visualizer } = require('rollup-plugin-visualizer')
    plugins.push(
      visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }) as any
    )
  }

  return {
    plugins,
    build: {
      target: 'es2015',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            router: ['react-router-dom'],
            motion: ['framer-motion'],
            query: ['@tanstack/react-query'],
            auth: ['@auth0/auth0-react'],
            monitoring: ['@sentry/react'],
            utils: ['react-swipeable', 'lucide-react'],
          },
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
      sourcemap: mode === 'development',
      chunkSizeWarningLimit: 500,
      cssCodeSplit: true,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'framer-motion'],
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: true,
      port: 4173,
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(
        process.env.npm_package_version || '1.0.0'
      ),
    },
  }
})
