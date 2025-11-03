import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      config: {
        theme: {
          extend: {
            colors: {
              duckYellow: {
                50: '#fffaf0',
                100: '#fef3c7',
                500: '#FFC630', // màu vàng chính
              },
              duckBlue: {
                50: '#f0f9ff',
                100: '#cfeefb',
                500: '#0B6E99', // màu xanh biển chính
                700: '#074c66'
              }
            }
          }
        }
      }
    }),
  ],
})
