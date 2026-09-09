import { test as base, expect } from '@playwright/test'

/**
 * Shared fixture.
 *
 * The suite runs against the Astro **dev** server (that is the server an agent
 * or a developer already has up), which injects `<astro-dev-toolbar>` into every
 * page. That toolbar is a real focusable widget and a real painted pill: left
 * alone it lands in the tab order and shows up in screenshot diffs, neither of
 * which has anything to do with the site. Hiding the custom element removes it
 * from both — the production build never ships it.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      const inject = () => {
        if (document.getElementById('pw-hide-astro-dev-toolbar')) return
        const parent = document.head ?? document.documentElement
        if (!parent) return
        const style = document.createElement('style')
        style.id = 'pw-hide-astro-dev-toolbar'
        style.textContent = 'astro-dev-toolbar { display: none !important }'
        parent.appendChild(style)
      }
      inject()
      document.addEventListener('DOMContentLoaded', inject)
    })
    await use(page)
  },
})

export { expect }
