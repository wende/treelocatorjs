import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import rescript from '@treelocator/vite-plugin-rescript'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // .res.js files contain raw JSX (because rescript.json sets
  // "jsx": { "preserve": true }). Tell esbuild to parse them as JSX both
  // during dev-time module loading and during the optimize-deps prescan.
  esbuild: {
    loader: 'jsx',
    include: [/\.jsx?$/, /\.res\.js$/],
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.res.js': 'jsx', '.js': 'jsx' },
    },
  },
  plugins: [
    rescript(),
    react({
      // Process .jsx and ReScript-compiled .res.js files (which contain JSX
      // because rescript.json sets "jsx": { "preserve": true }).
      include: [/\.jsx$/, /\.res\.js$/],
      // Use the classic JSX runtime so the __source attributes our rescript
      // plugin injects survive into the React element tree as React.createElement
      // props. The automatic-runtime dev plugin builds the source object from
      // AST loc instead, which would silently override our remapped values.
      // @vitejs/plugin-react already enables @babel/plugin-transform-react-jsx-source
      // for the classic runtime in dev mode.
      jsxRuntime: 'classic',
    }),
  ],
  resolve: {
    alias: {
      '@treelocator/runtime': path.resolve(
        __dirname,
        '../../packages/runtime/src/index.ts'
      ),
      '@treelocator/vite-plugin-rescript': path.resolve(
        __dirname,
        '../../packages/vite-plugin-rescript/src/index.ts'
      ),
    },
  },
})
