import { test, expect } from './helpers/test'
import {
  blurActiveElement,
  focusAsKeyboardUser,
  measureFocusDelta,
  settleAnimations,
} from './helpers/focus-ring'
import { blockVanDerHub, mockBrowserStream } from './helpers/van-der-hub'
import { firstGridDetail } from './helpers/routes'

/**
 * Six defects found in the accessibility audit, pinned so they cannot come back.
 *
 * Every assertion here reads something the browser actually computed or
 * painted — a resolved `position`, a laid-out rect, a settled `opacity`, or a
 * pixel diff between the focused and unfocused rendering. None of them look at
 * class names, because a class name is exactly what all six defects had while
 * still being broken.
 */

test.describe('D1 — the skip link never shifts the layout', () => {
  test('header stays flush at the top whether or not the skip link is focused', async ({
    page,
  }) => {
    await page.goto('/')

    const geometry = () =>
      page.evaluate(() => {
        const header = document.querySelector('header')!
        const main = document.querySelector('main')!
        return {
          headerTop: header.getBoundingClientRect().top,
          mainTop: main.getBoundingClientRect().top,
          documentHeight: document.documentElement.scrollHeight,
        }
      })

    const skip = page.getByRole('link', { name: 'Skip to content' })

    /* Resting: `sr-only` takes the link out of flow. The regression was an
       unlayered `position: relative` beating `sr-only`, which gave the link a
       line box and pushed the whole page down. */
    await expect(skip).toHaveCSS('position', 'absolute')
    const resting = await geometry()
    expect(resting.headerTop).toBe(0)

    await page.keyboard.press('Tab')
    await expect(skip).toBeFocused()
    await expect(skip).toHaveCSS('position', 'fixed')

    const focused = await geometry()
    expect(focused.headerTop).toBe(0)
    expect(focused.mainTop).toBeCloseTo(resting.mainTop, 1)
    expect(focused.documentHeight).toBe(resting.documentHeight)
  })

  test('the focused skip link is a real, visible, on-screen target', async ({
    page,
  }) => {
    await page.goto('/')
    const skip = page.getByRole('link', { name: 'Skip to content' })
    const delta = await measureFocusDelta(skip, { pad: 10 })

    /* `sr-only` clips it to 1x1 at rest; focusing has to give it real size. */
    expect(delta.restingRect.width).toBeLessThanOrEqual(2)
    expect(delta.rect.width).toBeGreaterThan(80)
    expect(delta.rect.height).toBeGreaterThan(24)
    expect(delta.rect.x).toBeGreaterThanOrEqual(0)
    expect(delta.rect.y).toBeGreaterThanOrEqual(0)
    expect(delta.changedPixels).toBeGreaterThan(500)
  })

  test('the skip link actually moves focus into main', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page.locator('main')).toBeFocused()
  })
})

test.describe('D2 — the bento tile focus ring is not clipped by the tile', () => {
  test('the ring paints outside all four edges of every tile', async ({
    page,
  }, testInfo) => {
    await page.goto('/')
    const tiles = page.locator('.bento-grid > a')
    const count = await tiles.count()
    expect(count).toBeGreaterThan(3)

    for (let i = 0; i < count; i++) {
      const tile = tiles.nth(i)

      /* The hazard the fix has to survive: the ringed element clips itself.
         If this ever stops being true the test below is no longer proving
         anything, so assert it explicitly. */
      await expect(tile).toHaveCSS('overflow', 'hidden')

      const delta = await measureFocusDelta(tile, { pad: 10 })
      const label = `bento tile #${i}`

      expect(
        delta.changedPixels,
        `${label}: focusing painted nothing`,
      ).toBeGreaterThan(1000)
      expect(
        delta.outerEdges.top,
        `${label}: no ring above the tile`,
      ).toBeGreaterThan(0)
      expect(
        delta.outerEdges.right,
        `${label}: no ring right of the tile`,
      ).toBeGreaterThan(0)
      expect(
        delta.outerEdges.bottom,
        `${label}: no ring below the tile`,
      ).toBeGreaterThan(0)
      expect(
        delta.outerEdges.left,
        `${label}: no ring left of the tile`,
      ).toBeGreaterThan(0)

      /* `> 0` alone does not pin this defect. The version being guarded against
         clipped only the gradient `::before`; its 1px outline at `outline-offset: 5px`
         sat outside the tile's own `overflow: hidden` and was never clipped, so it
         put ink in all four outer bands and passed every check above. Density is
         what separates them: `outerEdges` counts device pixels, so a 2px+2px core
         hugging the border inside a 6px band covers ~4 x edge-length x scale²,
         while a single 1px hairline reaches only ~1-1.7x. 2x sits between the two
         with room for antialiasing at the rounded corners. */
      const { scale, rect } = delta
      expect(
        delta.outerEdges.top,
        `${label}: ring above the tile is too thin to be the ring`,
      ).toBeGreaterThanOrEqual(2 * rect.width * scale * scale)
      expect(
        delta.outerEdges.bottom,
        `${label}: ring below the tile is too thin to be the ring`,
      ).toBeGreaterThanOrEqual(2 * rect.width * scale * scale)
      expect(
        delta.outerEdges.left,
        `${label}: ring left of the tile is too thin to be the ring`,
      ).toBeGreaterThanOrEqual(2 * rect.height * scale * scale)
      expect(
        delta.outerEdges.right,
        `${label}: ring right of the tile is too thin to be the ring`,
      ).toBeGreaterThanOrEqual(2 * rect.height * scale * scale)

      /* Ink genuinely outside the border box on every side, not just touching it. */
      const box = delta.changedBox!
      expect(box.x, `${label}: left ink`).toBeLessThan(delta.rect.x - 1)
      expect(box.y, `${label}: top ink`).toBeLessThan(delta.rect.y - 1)
      expect(box.x + box.width, `${label}: right ink`).toBeGreaterThan(
        delta.rect.x + delta.rect.width + 1,
      )
      expect(box.y + box.height, `${label}: bottom ink`).toBeGreaterThan(
        delta.rect.y + delta.rect.height + 1,
      )

      testInfo.annotations.push({
        type: 'ring',
        description: `${label} outer edges ${JSON.stringify(delta.outerEdges)}`,
      })
    }
  })
})

test.describe('D3 — /uses/ link rings wrap the link, not the list bullet', () => {
  test('the ring is at least the size of the link on every side', async ({
    page,
  }) => {
    await blockVanDerHub(page)
    await page.goto('/uses/')

    const link = page.locator('.fancy-list a').first()
    const delta = await measureFocusDelta(link, { pad: 10 })

    /* The regression drew the ring around the decorative list bullet: a box of
       roughly 6x8 CSS pixels, sitting outside the link entirely. */
    expect(delta.rect.width).toBeGreaterThan(60)
    const box = delta.changedBox!
    expect(box.width).toBeGreaterThanOrEqual(delta.rect.width)
    expect(box.height).toBeGreaterThanOrEqual(delta.rect.height)
    expect(box.width).toBeGreaterThan(40)
    expect(box.height).toBeGreaterThan(20)

    expect(delta.outerEdges.top).toBeGreaterThan(0)
    expect(delta.outerEdges.right).toBeGreaterThan(0)
    expect(delta.outerEdges.bottom).toBeGreaterThan(0)
    expect(delta.outerEdges.left).toBeGreaterThan(0)

    /* Same density floor as the bento tiles, for the same reason: the old rule
       drew a 1px outline at `outline-offset: 5px` around the link plus a
       gradient `::before` that the descendant-selector bug moved onto the list
       bullet, and that hairline alone satisfies every `> 0` check above.
       `outerEdges` counts device pixels, so the real 2px+2px core covers about
       4 x edge-length x scale² of its 6px band while the hairline reaches only
       ~1-1.7x; 2x discriminates. */
    const { scale, rect } = delta
    expect(
      delta.outerEdges.top,
      'ring above the link is too thin to be the ring',
    ).toBeGreaterThanOrEqual(2 * rect.width * scale * scale)
    expect(
      delta.outerEdges.bottom,
      'ring below the link is too thin to be the ring',
    ).toBeGreaterThanOrEqual(2 * rect.width * scale * scale)
    expect(
      delta.outerEdges.left,
      'ring left of the link is too thin to be the ring',
    ).toBeGreaterThanOrEqual(2 * rect.height * scale * scale)
    expect(
      delta.outerEdges.right,
      'ring right of the link is too thin to be the ring',
    ).toBeGreaterThanOrEqual(2 * rect.height * scale * scale)
  })

  test('the decorative bullet is drawn on the list item, never on its descendants', async ({
    page,
  }) => {
    await blockVanDerHub(page)
    await page.goto('/uses/')

    const pseudos = await page.evaluate(() => {
      const li = document.querySelector('.fancy-list li')!
      const link = li.querySelector('a')!
      const strong = li.querySelector('strong')!
      const content = (el: Element) => getComputedStyle(el, '::before').content
      return { li: content(li), link: content(link), strong: content(strong) }
    })

    expect(pseudos.li).toBe('""')
    expect(pseudos.link).toBe('none')
    expect(pseudos.strong).toBe('none')
  })
})

test.describe('D4 — the current-browser live region survives every update', () => {
  test('one region node stays mounted while its text changes', async ({
    page,
  }) => {
    const stream = await mockBrowserStream(page, 'com.apple.Safari')
    await page.goto('/uses/')

    const region = page.locator('p[role="status"]')
    await expect(region).toHaveCount(1)
    await expect(region).toHaveAttribute('aria-live', 'polite')
    await expect(region).toHaveAttribute('aria-atomic', 'true')

    /* Tag the live DOM node. A component that unmounts and remounts the region
       on every update loses the tag — and, in a screen reader, loses the
       announcement with it. */
    await region.evaluate((el) =>
      el.setAttribute('data-pinned-node', 'original'),
    )

    await expect(region).toHaveText('Current default browser: Safari')

    stream.set('com.google.Chrome')
    await expect(region).toHaveText('Current default browser: Chrome')

    stream.set('org.mozilla.firefox')
    await expect(region).toHaveText('Current default browser: Firefox')

    await expect(region).toHaveCount(1)
    await expect(region).toHaveAttribute('data-pinned-node', 'original')
  })

  test('an unknown bundle id still announces something', async ({ page }) => {
    const stream = await mockBrowserStream(page, 'com.apple.Safari')
    await page.goto('/uses/')
    const region = page.locator('p[role="status"]')

    await expect(region).toHaveText('Current default browser: Safari')
    stream.set('com.example.MysteryBrowser')
    await expect(region).toHaveText(
      'Current default browser: com.example.MysteryBrowser',
    )
  })
})

test.describe('D5 — the boundary photo control is inert', () => {
  test('the disabled "previous" control cannot navigate or take focus', async ({
    page,
  }) => {
    /* The newest photo sorts first, so its detail page has no previous photo. */
    const newest = await firstGridDetail(page)
    await page.goto(newest)

    const prev = page.getByRole('link', { name: 'Go to previous photo' })
    await expect(prev).toBeVisible()

    const attrs = await prev.evaluate((el) => ({
      hasHref: el.hasAttribute('href'),
      role: el.getAttribute('role'),
      ariaDisabled: el.getAttribute('aria-disabled'),
      ariaLabel: el.getAttribute('aria-label'),
      pointerEvents: getComputedStyle(el).pointerEvents,
    }))

    /* No `href` at all — an `href="#"` placeholder is what used to bounce the
       URL to `/grid/<id>/#` on activation. The explicit role keeps the label
       exposed, because an href-less <a> otherwise maps to `generic`. */
    expect(attrs.hasHref).toBe(false)
    expect(attrs.role).toBe('link')
    expect(attrs.ariaDisabled).toBe('true')
    expect(attrs.ariaLabel).toBe('Go to previous photo')
    expect(attrs.pointerEvents).toBe('none')

    const before = page.url()
    await prev.evaluate((el: HTMLElement) => el.click())
    await page.waitForTimeout(300)
    expect(page.url()).toBe(before)

    /* Not focusable, and therefore not a dead stop in the tab order. */
    const tookFocus = await prev.evaluate((el: HTMLElement) => {
      el.focus()
      return document.activeElement === el
    })
    expect(tookFocus).toBe(false)

    const reached: string[] = []
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab')
      reached.push(
        await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null
          return el
            ? `${el.tagName}:${el.getAttribute('aria-label') ?? el.id ?? ''}`
            : 'none'
        }),
      )
    }
    expect(reached.join(' | ')).not.toContain('Go to previous photo')
  })

  test('the enabled "next" control does navigate', async ({ page }) => {
    const newest = await firstGridDetail(page)
    await page.goto(newest!)

    const next = page.getByRole('link', { name: 'Go to next photo' })
    await expect(next).toHaveAttribute('href', /^\/grid\/.+\/$/)
    await next.click()
    await expect(page).not.toHaveURL(new RegExp(`${newest}$`))
    await expect(page.locator('main h1')).toBeVisible()
  })
})

test.describe('D6 — Hot Stuff dims the right items', () => {
  test('a focused item stays at full opacity while a different item is hovered', async ({
    page,
  }) => {
    await page.goto('/')

    const items = page.locator('.hot-stuff li')
    const links = page.locator('.hot-stuff li a')
    await expect(items).toHaveCount(5)

    const opacities = async () =>
      items.evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity))

    /* Baseline: nothing hovered, nothing focused. */
    await expect.poll(opacities).toEqual(['1', '1', '1', '1', '1'])

    await focusAsKeyboardUser(links.nth(1))
    await settleAnimations(items.nth(0))
    /* 150ms opacity transition — poll rather than sleep. */
    await expect.poll(opacities).toEqual(['0.5', '1', '0.5', '0.5', '0.5'])

    /* The regression: hovering *any* item while another was focused dimmed all
       five, including the focused one, so the keyboard user lost their place. */
    await links.nth(0).hover()
    expect(
      await links.nth(1).evaluate((el) => el.matches(':focus-visible')),
    ).toBe(true)
    await expect.poll(opacities).toEqual(['1', '1', '0.5', '0.5', '0.5'])

    /* Hover-only dimming still works once focus is gone. */
    await blurActiveElement(page)
    await links.nth(2).hover()
    await expect.poll(opacities).toEqual(['0.5', '0.5', '1', '0.5', '0.5'])

    /* And everything returns to full opacity when the pointer leaves. */
    await page.mouse.move(5, 5)
    await expect.poll(opacities).toEqual(['1', '1', '1', '1', '1'])
  })
})
