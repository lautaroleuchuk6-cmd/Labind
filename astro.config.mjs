import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Cuando registres el dominio propio, cambiá esta URL y la de src/config.ts.
export default defineConfig({
  site: 'https://labind.pages.dev',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
