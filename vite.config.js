import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // You might need to install 'path' if not available

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // This tells Vite that @ translates to the /src folder
            "@": path.resolve(__dirname, "./src"),
        },
    },
})