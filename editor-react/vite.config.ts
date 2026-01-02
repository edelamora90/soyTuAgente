import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}, // 👈 CLAVE
  },
  build: {
    target: 'es2018',
    lib: {
      entry: 'src/editor-wc.tsx',
      name: 'BlogEditor',
      fileName: () => 'blog-editor.js',
      formats: ['iife'],
    },
  },
})
