import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Reutiliza la configuración de Vite (incluye el alias "@" → ./src)
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
      // Los tests no deben escribir en la consola con los logs de la app
      silent: true,
    },
  })
);
