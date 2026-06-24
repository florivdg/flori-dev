import { defineConfig } from 'astro/config'
import { unified } from '@astrojs/markdown-remark'
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

import vercel from '@astrojs/vercel'

// https://astro.build/config
export default defineConfig({
  site: 'https://flori.dev',
  prefetch: true,

  experimental: {
    clientPrerender: true,
  },

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
    plugins: [tailwindcss()],
  },

  // Astro 7 defaults to the Rust-based Sätteri Markdown processor. Opt back
  // into the unified() pipeline so our remark plugin and rehype-based
  // Expressive Code integration keep working.
  markdown: {
    processor: unified({
      remarkPlugins: [
        [remarkExternalLinks, { target: '_blank', rel: 'noopener noreferrer' }],
      ],
    }),
  },

  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
  }),

  security: {
    csp: false, // Incompatible with Expressive Code's inline styles and scripts
  },
})
