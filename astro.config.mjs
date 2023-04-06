import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'

import image from '@astrojs/image'

// https://astro.build/config
import vue from '@astrojs/vue'

// https://astro.build/config
import mdx from '@astrojs/mdx'

// https://astro.build/config
import vercel from '@astrojs/vercel/static'

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
    image({
      serviceEntryPoint: '@astrojs/image/sharp',
    }),
    vue(),
    mdx(),
  ],
  output: 'static',
  adapter: vercel({
    analytics: true,
  }),
})
