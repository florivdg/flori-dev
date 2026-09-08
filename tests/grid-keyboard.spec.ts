import { test, expect } from './helpers/test'
import { focusAsKeyboardUser } from './helpers/focus-ring'
import { islandsHydrated } from './helpers/routes'

/**
 * Keyboard navigation of the photo grid.
 *
 * The grid adds arrow / Home / End movement on top of the normal tab order.
 * Anything that intercepts keys has to be judged on two things at once: that it
 * does what it promises, and that it does not quietly take keys away from the
 * user — no trap, no swallowed browser shortcuts, no hijacked page scrolling.
 */

const focusedIndex = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[data-grid-link]'))
    return links.indexOf(document.activeElement as Element)
  })

const linkCount = (page: import('@playwright/test').Page) =>
  page.locator('a[data-grid-link]').count()

test.describe('/grid/ roving arrow-key navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/grid/')
  })

  test('Right and Left step through the photos', async ({ page }) => {
    const links = page.locator('a[data-grid-link]')
    await focusAsKeyboardUser(links.first())
    expect(await focusedIndex(page)).toBe(0)

    await page.keyboard.press('ArrowRight')
    expect(await focusedIndex(page)).toBe(1)

    await page.keyboard.press('ArrowRight')
    expect(await focusedIndex(page)).toBe(2)

    await page.keyboard.press('ArrowLeft')
    expect(await focusedIndex(page)).toBe(1)
  })

  test('Home and End jump to the first and last photo', async ({ page }) => {
    const links = page.locator('a[data-grid-link]')
    const total = await linkCount(page)
    expect(total).toBeGreaterThan(6)

    await focusAsKeyboardUser(links.nth(4))
    await page.keyboard.press('End')
    expect(await focusedIndex(page)).toBe(total - 1)

    await page.keyboard.press('Home')
    expect(await focusedIndex(page)).toBe(0)
  })

  test('Down and Up move between rows, staying in the same column', async ({
    page,
  }) => {
    const links = page.locator('a[data-grid-link]')
    await focusAsKeyboardUser(links.first())

    const columnOf = () =>
      page.evaluate(() =>
        Math.round(
          (document.activeElement as HTMLElement).getBoundingClientRect().left,
        ),
      )
    const rowOf = () =>
      page.evaluate(() =>
        Math.round(
          (document.activeElement as HTMLElement).getBoundingClientRect().top,
        ),
      )

    const startColumn = await columnOf()
    const startRow = await rowOf()

    await page.keyboard.press('ArrowDown')
    expect(await focusedIndex(page)).toBeGreaterThan(0)
    expect(await columnOf()).toBe(startColumn)
    expect(await rowOf()).not.toBe(startRow)

    await page.keyboard.press('ArrowUp')
    expect(await focusedIndex(page)).toBe(0)
    expect(await columnOf()).toBe(startColumn)
  })

  test('the ends of the grid clamp instead of wrapping or losing focus', async ({
    page,
  }) => {
    const links = page.locator('a[data-grid-link]')
    const total = await linkCount(page)

    await focusAsKeyboardUser(links.first())
    await page.keyboard.press('ArrowLeft')
    expect(await focusedIndex(page)).toBe(0)
    await page.keyboard.press('ArrowUp')
    expect(await focusedIndex(page)).toBe(0)

    await page.keyboard.press('End')
    await page.keyboard.press('ArrowRight')
    expect(await focusedIndex(page)).toBe(total - 1)
    await page.keyboard.press('ArrowDown')
    expect(await focusedIndex(page)).toBe(total - 1)
  })

  test('Tab and Shift+Tab still leave the grid — no keyboard trap', async ({
    page,
  }) => {
    const links = page.locator('a[data-grid-link]')
    const total = await linkCount(page)

    await focusAsKeyboardUser(links.nth(total - 1))
    await page.keyboard.press('Tab')
    expect(
      await focusedIndex(page),
      'Tab from the last photo stayed inside the grid',
    ).toBe(-1)

    await focusAsKeyboardUser(links.first())
    await page.keyboard.press('Shift+Tab')
    expect(
      await focusedIndex(page),
      'Shift+Tab from the first photo stayed inside the grid',
    ).toBe(-1)
    const escapedTo = await page.evaluate(
      () =>
        (document.activeElement as HTMLElement)?.textContent
          ?.trim()
          .slice(0, 20) ?? '',
    )
    expect(escapedTo.length).toBeGreaterThan(0)
  })

  test('modified arrow presses are left to the browser', async ({ page }) => {
    const links = page.locator('a[data-grid-link]')
    await focusAsKeyboardUser(links.nth(1))

    /* Shift+Arrow, Alt+Arrow and friends belong to the browser and to assistive
       technology. The handler bails out on any modifier, so focus must not move. */
    for (const key of [
      'Shift+ArrowRight',
      'Alt+ArrowRight',
      'Control+ArrowRight',
    ]) {
      await page.keyboard.press(key)
      expect(await focusedIndex(page), `${key} moved focus`).toBe(1)
    }
  })
})

test.describe('/grid/ does not hijack page scrolling', () => {
  test('arrow keys scroll normally when the grid is not focused', async ({
    page,
  }) => {
    await page.goto('/grid/')
    await page.evaluate(() => window.scrollTo(0, 0))

    /* Focus the header link, i.e. deliberately outside the grid. */
    await focusAsKeyboardUser(
      page.locator('nav[aria-label="Primary"] a').first(),
    )

    const before = await page.evaluate(() => window.scrollY)
    await page.keyboard.press('ArrowDown')
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(before)

    await page.keyboard.press('PageDown')
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(before)
  })

  test('stepping sideways within a fully visible row does not scroll the page', async ({
    page,
  }) => {
    await page.goto('/grid/')
    const links = page.locator('a[data-grid-link]')
    await focusAsKeyboardUser(links.first())

    /* Park the first row entirely on screen. A focus move that has to reveal an
       off-screen tile legitimately scrolls; this test is about the case where
       nothing needs revealing. */
    await page.evaluate(() => {
      const first = document.querySelector('a[data-grid-link]')!
      window.scrollBy(0, first.getBoundingClientRect().top - 20)
    })
    await page.waitForTimeout(100)

    const rowTop = await page.evaluate(() =>
      Math.round(
        (document.activeElement as HTMLElement).getBoundingClientRect().top,
      ),
    )
    const before = await page.evaluate(() => window.scrollY)
    expect(rowTop).toBeGreaterThan(0)

    await page.keyboard.press('ArrowRight')

    /* Same row, already fully visible: nothing should move. Before the handler
       called preventDefault, the arrow key also scrolled the document. */
    expect(await focusedIndex(page)).toBe(1)
    expect(
      await page.evaluate(() =>
        Math.round(
          (document.activeElement as HTMLElement).getBoundingClientRect().top,
        ),
      ),
    ).toBe(rowTop)
    expect(await page.evaluate(() => window.scrollY)).toBe(before)
  })

  test('unhandled keys are not swallowed', async ({ page }) => {
    await page.goto('/grid/')
    const links = page.locator('a[data-grid-link]')
    await focusAsKeyboardUser(links.first())
    await page.evaluate(() => window.scrollTo(0, 0))

    const before = await page.evaluate(() => window.scrollY)
    await page.keyboard.press('PageDown')
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(before)
  })
})

test.describe('photo detail arrow navigation', () => {
  test('Left and Right move between photos', async ({ page }) => {
    await page.goto('/grid/')
    const hrefs = await page
      .locator('a[data-grid-link]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')!))

    await page.goto(hrefs[0])
    await islandsHydrated(page)
    await page.keyboard.press('ArrowRight')
    await expect(page).toHaveURL(new RegExp(`${hrefs[1]}$`))

    // The arrow keys are handled by a client:load island, so the next press is
    // only honoured once the freshly loaded page has hydrated.
    await islandsHydrated(page)
    await page.keyboard.press('ArrowLeft')
    await expect(page).toHaveURL(new RegExp(`${hrefs[0]}$`))
  })

  test('the boundary direction simply does nothing', async ({ page }) => {
    await page.goto('/grid/')
    const first = await page
      .locator('a[data-grid-link]')
      .first()
      .getAttribute('href')
    await page.goto(first!)
    await islandsHydrated(page)

    const before = page.url()
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(400)
    expect(page.url()).toBe(before)
  })
})
