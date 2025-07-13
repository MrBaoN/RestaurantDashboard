import { defineConfig } from 'vite'

// run this in terminal: npm install --save-dev @types/node
export default defineConfig({
  server: {
    host: '0.0.0.0',  // This ensures Vite listens on all network interfaces
    port: Number(process.env.PORT) || 5173,  // Default port 3000, but Render will pass a custom PORT env var
  },
  build: {
    outDir: 'dist',  // Output directory for production build
  },
});

