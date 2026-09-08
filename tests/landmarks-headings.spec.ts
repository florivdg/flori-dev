import { test, expect } from './helpers/test'
import { ROUTES, gotoRoute } from './helpers/routes'
import { mockBrowserStats, mockBrowserStream } from './helpers/van-der-hub'

/**
 * Document structure on every route the site serves.
 *
 * Headings are read with `document.querySelectorAll` rather than a Playwright
 * role locator on purpose: role locators pierce shadow roots, and the Astro dev
 * server's toolbar has an `<h1>` of its own inside one. The light DOM is what a
 * screen reader on the production page walks.
 */

test.beforeEach(async ({ page }) => {
  await mockBrowserStats(page)
  await mockBrowserStream(page, 'com.apple.Safari')
})

interface Outline {
  headings: { level: number; text: string; hidden: boolean }[]
  mainCount: number
  mainId: string | null
  mainTabIndex: string | null
  lang: string
  title: string
  ariaCurrent: { href: string | null; value: string | null }[]
}

const readOutline = (page: import('@playwright/test').Page) =>
  page.evaluate<Outline>(() => {
    const visible = (el: Element) => {
      const style = getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden'
    }
    const main = document.querySelector('main')
    return {
      headings: Array.from(
        document.querySelectorAll('h1, h2, h3, h4, h5, h6'),
      ).map((h) => ({
        level: Number(h.tagName[1]),
        text: (h.textContent ?? '').replace(/\s+/g, ' ').trim(),
        hidden: !visible(h),
      })),
      mainCount: document.querySelectorAll('main').length,
      mainId: main?.id ?? null,
      mainTabIndex: main?.getAttribute('tabindex') ?? null,
      lang: document.documentElement.lang,
      title: document.title,
      ariaCurrent: Array.from(document.querySelectorAll('[aria-current]')).map(
        (el) => ({
          href: el.getAttribute('href'),
          value: el.getAttribute('aria-current'),
        }),
      ),
    }
  })

for (const route of ROUTES) {
  test.describe(`${route.name}`, () => {
    test('has one h1 and no skipped heading levels', async ({ page }) => {
      const path = await gotoRoute(page, route)
      const outline = await readOutline(page)

      const levels = outline.headings.map((h) => h.level)
      expect(
        levels.length,
        `${path}: page has no headings at all`,
      ).toBeGreaterThan(0)
      expect(
        levels.filter((l) => l === 1).length,
        `${path}: expected exactly one h1, got ${JSON.stringify(outline.headings.filter((h) => h.level === 1).map((h) => h.text))}`,
      ).toBe(1)
      expect(levels[0], `${path}: the first heading must be the h1`).toBe(1)

      for (let i = 1; i < levels.length; i++) {
        expect(
          levels[i] - levels[i - 1],
          `${path}: h${levels[i - 1]} "${outline.headings[i - 1].text}" is followed by h${levels[i]} "${outline.headings[i].text}"`,
        ).toBeLessThanOrEqual(1)
      }

      for (const heading of outline.headings) {
        expect(
          heading.text,
          `${path}: empty heading at level ${heading.level}`,
        ).not.toBe('')
      }
    })

    test('exposes the landmarks a screen reader navigates by', async ({
      page,
    }) => {
      const path = await gotoRoute(page, route)
      const outline = await readOutline(page)

      /* One main, addressable by the skip link and focusable so the jump lands. */
      expect(outline.mainCount, `${path}: expected exactly one <main>`).toBe(1)
      expect(outline.mainId).toBe('main')
      expect(outline.mainTabIndex).toBe('-1')
      await expect(page.getByRole('main')).toHaveCount(1)

      expect(outline.lang).toBe('en')
      expect(outline.title.trim().length).toBeGreaterThan(0)

      if (route.chrome) {
        await expect(
          page.getByRole('banner'),
          `${path}: banner landmark`,
        ).toHaveCount(1)
        await expect(
          page.getByRole('contentinfo'),
          `${path}: contentinfo landmark`,
        ).toHaveCount(1)

        /* Every navigation landmark needs a name, otherwise the rotor lists
           several indistinguishable "navigation" entries. */
        const navNames = await page
          .locator('nav')
          .evaluateAll((navs) =>
            navs.map(
              (n) =>
                n.getAttribute('aria-label') ??
                n.getAttribute('aria-labelledby'),
            ),
          )
        expect(navNames.length).toBeGreaterThan(0)
        for (const name of navNames)
          expect(name, `${path}: unnamed <nav>`).toBeTruthy()
        expect(new Set(navNames).size, `${path}: duplicate nav names`).toBe(
          navNames.length,
        )
      } else {
        /* The photo view is deliberately chrome-free. Assert that, so a
           regression that quietly reintroduces a stray header is caught. */
        await expect(page.getByRole('banner')).toHaveCount(0)
        await expect(page.getByRole('contentinfo')).toHaveCount(0)
      }
    })

    test('marks the current page exactly once', async ({ page }) => {
      const path = await gotoRoute(page, route)
      const outline = await readOutline(page)

      if (!route.chrome) {
        expect(outline.ariaCurrent).toEqual([])
        return
      }

      expect(
        outline.ariaCurrent.length,
        `${path}: aria-current found on ${JSON.stringify(outline.ariaCurrent)}`,
      ).toBe(1)

      const [current] = outline.ariaCurrent
      expect(current.value).toBe('page')
      expect(current.href, `${path}: aria-current href`).toBeTruthy()
      /* `/uses/browserstats` correctly marks the `/uses/` nav entry, so the
         rule is "the marked href is this page or an ancestor of it". */
      expect(
        path === current.href || path.startsWith(current.href!),
        `${path} is not covered by aria-current href ${current.href}`,
      ).toBe(true)
    })
  })
}
