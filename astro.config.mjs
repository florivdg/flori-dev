import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import remarkExternalLinks from './src/plugins/remarkExternalLinks'

// https://astro.build/config
import vue from '@astrojs/vue'

// https://astro.build/config
import mdx from '@astrojs/mdx'

// https://astro.build/config
import sitemap from '@astrojs/sitemap'

// https://astro.build/config
import expressiveCode from 'astro-expressive-code'

// https://astro.build/config
export default defineConfig({
  site: 'https://flori.dev',
  integrations: [
    vue(),
    expressiveCode({
      styleOverrides: {
        uiFontFamily: 'Mona Sans, sans-serif',
        uiFontWeight: '600',
        codeFontFamily: 'Monaspace Neon, monospace',
        codeFontWeight: '450',
      },
    }),
    mdx(),
    sitemap(),
  ],
  output: 'static',
  vite: {
    define: {
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [
      [remarkExternalLinks, { target: '_blank', rel: 'noopener noreferrer' }],
    ],
  },
})
