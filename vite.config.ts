import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
    host: true,
  },
  optimizeDeps: {
    entries: ['index.html'],
    include: [
      'react-is',
      '@tanem/react-nprogress',
      'react-bootstrap',
      'feather-icons-react',
      'simplebar-react',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Aliases do tema Datta Able Free (React)
      'layouts': path.resolve(__dirname, './src/styles/themes/datta-able-free/react/src/layouts'),
      'hooks': path.resolve(__dirname, './src/styles/themes/datta-able-free/react/src/hooks'),
      'contexts': path.resolve(__dirname, './src/styles/themes/datta-able-free/react/src/contexts'),
      'store': path.resolve(__dirname, './src/styles/themes/datta-able-free/react/src/store'),
      'components': path.resolve(__dirname, './src/styles/themes/datta-able-free/react/src/components'),
      'assets': path.resolve(__dirname, './src/styles/themes/datta-able-free/react/src/assets'),
      'config': path.resolve(__dirname, './src/styles/themes/datta-able-free/react/src/config'),
      'menu-items': path.resolve(__dirname, './src/styles/themes/datta-able-free/react/src/menu-items.js'),
      'menu-items-collapse': path.resolve(__dirname, './src/styles/themes/datta-able-free/react/src/menu-items-collapse.js'),
    },
  },
})
