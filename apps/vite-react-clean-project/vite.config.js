import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import solidPlugin from 'vite-plugin-solid'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    solidPlugin({
      // Only process Solid files in the runtime package
      include: /packages\/runtime\/.*\.tsx?$/
    }),
    react({
      // Process React files in src directory only
      include: /src\/.*\.jsx$/,
      babel: {
        plugins: [
          '@babel/plugin-transform-react-jsx-source',
          ['@locator/babel-jsx/dist', { env: 'development' }]
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@treelocator/runtime': path.resolve(__dirname, '../../packages/runtime/src/index.ts')
    }
  }
})
