import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isDev = mode === 'development';
    return {
      root: '.',
      server: {
        port: 0,
        host: '0.0.0.0',
      },
      plugins: [
        react({
          babel: {
            presets: [
              ['@babel/preset-react', {
                runtime: 'automatic',
                development: isDev,
              }],
            ],
            plugins: isDev ? [
              '@babel/plugin-transform-react-jsx-source',
              ['@locator/babel-jsx/dist', { env: 'development' }],
            ] : [],
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
