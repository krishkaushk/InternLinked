import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite' 

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(), // This now has a reference to the import above
      ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src/internlinked"),
        },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
})