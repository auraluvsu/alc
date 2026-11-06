import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `vite build`                 → normal deployable site in dist/, real paths (/tour, /design)
// `vite build --mode artifact` → one self-contained file in dist-artifact/, hash routes (#tour, #design)
export default defineConfig(({ mode }) => ({
  plugins: mode === 'artifact' ? [react(), viteSingleFile()] : [react()],
  build: { outDir: mode === 'artifact' ? 'dist-artifact' : 'dist' },
}))
