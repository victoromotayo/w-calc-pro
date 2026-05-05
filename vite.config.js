import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'W-Calc Pro',
        short_name: 'W-Calc',
        description: 'Professional Scientific Calculator',
        theme_color: '#050505',
        background_color: '#050505',
        display: 'standalone',
        icons: [
          {
            // You can replace this URL with your actual W. logo later!
            src: 'https://cdn-icons-png.flaticon.com/512/3300/3300057.png', 
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/w-calc-pro/', // VERY IMPORTANT: This must match your GitHub repository name exactly!
})