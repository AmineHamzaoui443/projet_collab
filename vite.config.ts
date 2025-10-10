import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // load env vars so we can pass VITE_API_PROXY when running in Docker
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxy = env.VITE_API_PROXY || 'http://localhost:3000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiProxy,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
