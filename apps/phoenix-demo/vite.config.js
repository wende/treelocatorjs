import { defineConfig } from 'vite'
import path from 'path'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
  root: '.',
  plugins: [
    solidPlugin()
  ],
  resolve: {
    alias: {
      '@treelocator/runtime': path.resolve(__dirname, '../../packages/runtime/src/index.ts')
    }
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    rollupOptions: {
      input: 'index.html'
    }
  },
  server: {
    port: 3344
  }
})
