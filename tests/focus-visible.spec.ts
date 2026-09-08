import { test, expect } from './helpers/test'
import {
  focusAsKeyboardUser,
  focusChangesGeometry,
  measureFocusDelta,
  measureFocusDeltaOfActive,
  paddedBoxIsOnScreen,
  ringOnAllEdges,
  settleAnimations,
  type FocusDelta,
} from './helpers/focus-ring'
import { firstGridDetail } from './helpers/routes'
import { blockVanDerHub } from './helpers/van-der-hub'

/**
 * Every keyboard stop must show where focus is.
 *
 * The walk is driven by real `Tab` presses, and each stop is judged on pixels:
 * the region around the focused element is screenshotted focused and unfocused
 * and the two are diffed. Nothing here inspects a class name — a `.focus-ring`
 * class on an element whose ancestor clips it away would sail through a class
 * assertion and fail this one.
 */

interface Walk {
  route: string
  /** Long link lists repeat the same construct; a prefix is enough to cover it. */
  maxStops: number
}

const WALKS: Walk[] = [
  { route: '/', maxStops: 22 },
  { route: '/uses/', maxStops: 14 },
  { route: '/about/', maxStops: 20 },
  { route: '/reads/', maxStops: 10 },
  { route: '/grid/', maxStops: 10 },
  { route: '/imprint/', maxStops: 20 },
  { route: '/privacy-policy/', maxStops: 20 },
]

/** Enough changed pixels that no plausible rendering difference is an accident. */
const MIN_CHANGED_PIXELS = 100

function assertIndicator(
  delta: FocusDelta,
  label: string,
  viewport: { width: number; height: number },
) {
  expect(
    delta.changedPixels,
    `${label}: focusing this element changed nothing on screen`,
  ).toBeGreaterThan(MIN_CHANGED_PIXELS)

  /* An element that also grows or unskews on focus is unmistakable on its own,
     and its geometry change swamps the ring in the diff — so only demand the
     full four-sided ring where the box stays put and the whole ring margin was
     actually inside the viewport when the shots were taken. */
  if (!focusChangesGeometry(delta) && paddedBoxIsOnScreen(delta, viewport)) {
    expect(
      ringOnAllEdges(delta),
      `${label}: indicator is missing on at least one side — outer ${JSON.stringify(delta.outerEdges)}, inner ${JSON.stringify(delta.innerEdges)}`,
    ).toBe(true)
  }
}

for (const walk of WALKS) {
  test(`every tab stop on ${walk.route} shows a focus indicator`, async ({
    page,
  }) => {
    await blockVanDerHub(page)
    await page.goto(walk.route)
    const viewport = page.viewportSize()!

    let stops = 0
    for (let i = 0; i < walk.maxStops; i++) {
      await page.keyboard.press('Tab')

      const described = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        if (!el || el === document.body || el === document.documentElement)
          return null
        const name =
          el.getAttribute('aria-label') ??
          (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40)
        return `${el.tagName.toLowerCase()} "${name}"`
      })

      /* Focus fell off the end of the document — the walk is complete. */
      if (described === null) break

      stops++
      const delta = await measureFocusDeltaOfActive(page, { pad: 8 })
      assertIndicator(delta, `${walk.route} stop ${i} — ${described}`, viewport)
    }

    expect(
      stops,
      `${walk.route}: no tab stops were reached at all`,
    ).toBeGreaterThan(3)
  })
}

test('the photo detail view indicates focus on all of its controls', async ({
  page,
}) => {
  const newest = await firstGridDetail(page)
  await page.goto(newest!)
  const viewport = page.viewportSize()!

  const controls = [
    page.getByRole('link', { name: 'Go back to the photo grid' }),
    page.getByRole('button', { name: /photograph details/ }),
    page.getByRole('link', { name: 'Go to next photo' }),
  ]

  for (const control of controls) {
    const name =
      (await control.getAttribute('aria-label')) ??
      (await control.getAttribute('title'))
    const delta = await measureFocusDelta(control, { pad: 8 })
    assertIndicator(delta, `photo detail — ${name}`, viewport)
  }
})

test('the primary nav indicator survives the pill’s own overflow clip', async ({
  page,
}) => {
  await page.goto('/about/')

  const list = page.locator('nav[aria-label="Primary"] ul')
  /* The hazard: the pill clips, so any outward ring on a child is cut off. The
     indicator therefore has to be painted inside the link's own box. */
  await expect(list).toHaveCSS('overflow', 'hidden')

  const links = page.locator('nav[aria-label="Primary"] a')
  const count = await links.count()
  expect(count).toBe(5)

  for (let i = 0; i < count; i++) {
    const delta = await measureFocusDelta(links.nth(i), { pad: 8 })
    const label = `nav link #${i}`
    expect(delta.changedPixels, `${label}: nothing painted`).toBeGreaterThan(
      MIN_CHANGED_PIXELS,
    )
    expect(
      delta.innerEdges.top,
      `${label}: no indicator along the top`,
    ).toBeGreaterThan(0)
    expect(
      delta.innerEdges.right,
      `${label}: no indicator along the right`,
    ).toBeGreaterThan(0)
    expect(
      delta.innerEdges.bottom,
      `${label}: no indicator along the bottom`,
    ).toBeGreaterThan(0)
    expect(
      delta.innerEdges.left,
      `${label}: no indicator along the left`,
    ).toBeGreaterThan(0)
  }
})

test('the photo grid indicator survives the tile’s own overflow clip', async ({
  page,
}) => {
  await page.goto('/grid/')

  const link = page.locator('a[data-grid-link]').first()
  await expect(link).toHaveCSS('overflow', 'hidden')

  const delta = await measureFocusDelta(link, { pad: 10 })
  expect(delta.changedPixels).toBeGreaterThan(1000)
  expect(delta.innerEdges.top).toBeGreaterThan(0)
  expect(delta.innerEdges.right).toBeGreaterThan(0)
  expect(delta.innerEdges.bottom).toBeGreaterThan(0)
  expect(delta.innerEdges.left).toBeGreaterThan(0)
})

test('a mouse click does not paint the keyboard indicator', async ({
  page,
}) => {
  const newest = await firstGridDetail(page)
  await page.goto(newest!)

  /* A real toggle button, so this can be clicked with a real mouse without
     navigating away mid-assertion. */
  const button = page.getByRole('button', { name: /photograph details/ })

  await button.click()
  const afterClick = await button.evaluate((el) => ({
    focused: document.activeElement === el,
    focusVisible: el.matches(':focus-visible'),
  }))

  expect(afterClick.focused, 'a clicked button should hold DOM focus').toBe(
    true,
  )
  /* `:focus-visible`, not `:focus` — a pointer user should not be left with a
     keyboard ring stuck on the page. */
  expect(
    afterClick.focusVisible,
    'a mouse click must not arm :focus-visible',
  ).toBe(false)

  /* ...and the same control must light up the moment a keyboard is used. */
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  expect(
    await button.evaluate(
      (el) => document.activeElement === el && el.matches(':focus-visible'),
    ),
  ).toBe(true)
})

test('the grid overlay ring follows the tile’s rounded corner', async ({
  page,
}) => {
  await page.goto('/grid/')

  const link = page.locator('a[data-grid-link]').first()
  await focusAsKeyboardUser(link)
  await settleAnimations(link)

  const radii = await link.evaluate((el) => {
    const tile = el.closest('li')!
    return {
      link: getComputedStyle(el).borderRadius,
      after: getComputedStyle(el, '::after').borderRadius,
      tile: getComputedStyle(tile).borderRadius,
    }
  })

  /* The `<li>` clips with `overflow-hidden` at `rounded-lg`. If the `<a>` stays
     square, the overlay ring — which inherits its radius — is shaved at each
     corner apex while the tile itself curves. */
  expect(radii.tile, 'the tile should clip at a rounded radius').not.toBe('0px')
  expect(radii.link, 'the link must share the tile’s radius').toBe(radii.tile)
  expect(
    radii.after,
    'the ring pseudo element must share the tile’s radius',
  ).toBe(radii.tile)
})
