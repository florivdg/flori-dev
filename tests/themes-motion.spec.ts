import { test, expect } from './helpers/test'
import type { Page } from '@playwright/test'
import { contrast, luminance, resolveColors, type Rgb } from './helpers/color'
import { blockVanDerHub } from './helpers/van-der-hub'
import {
  blurActiveElement,
  focusAsKeyboardUser,
  settleAnimations,
} from './helpers/focus-ring'
import { firstGridDetail } from './helpers/routes'

/**
 * Colour scheme and motion preferences.
 *
 * The site's `dark` variant is custom and has two independent branches — a
 * `.dark` class and a `prefers-color-scheme` media query — because the photo
 * pages force dark regardless of the OS. A test that only ever exercises the
 * media query would let the class branch rot, so both are driven here, and the
 * media features are flipped with `page.emulateMedia()` so one page can be
 * observed under both.
 */

interface Palette {
  coreIn: string
  coreOut: string
  haloFrom: string
  haloTo: string
  pageBackground: string
}

/**
 * Read the indicator tokens off an element that actually paints a ring, not off
 * `:root`. `:where(.dark, .dark *)` has zero specificity, so on a forced-dark
 * page the `<html>` element itself still resolves the `:root` (light) values —
 * every descendant, including every focusable control, resolves the dark ones.
 */
const readPalette = (page: Page, selector: string) =>
  page.evaluate<Palette, string>((selector) => {
    const el = document.querySelector(selector)
    if (!el) throw new Error(`no element for ${selector}`)
    const style = getComputedStyle(el)
    return {
      coreIn: style.getPropertyValue('--focus-core-in').trim(),
      coreOut: style.getPropertyValue('--focus-core-out').trim(),
      haloFrom: style.getPropertyValue('--focus-halo-from').trim(),
      haloTo: style.getPropertyValue('--focus-halo-to').trim(),
      pageBackground: getComputedStyle(document.body).backgroundColor,
    }
  }, selector)

async function assertUsablePalette(
  page: Page,
  palette: Palette,
  label: string,
) {
  const [coreIn, coreOut, background] = await resolveColors(page, [
    palette.coreIn,
    palette.coreOut,
    palette.pageBackground,
  ])

  /* The whole point of the two-tone core: the band facing the page has to read
     against the page, and the two bands have to read against each other, so at
     least one of them survives whatever the element itself is sitting on. */
  expect(
    contrast(coreOut, background),
    `${label}: outer band vs page background`,
  ).toBeGreaterThan(3)
  expect(
    contrast(coreIn, coreOut),
    `${label}: the two core bands vs each other`,
  ).toBeGreaterThan(3)
  expect(palette.haloFrom, `${label}: pink halo`).not.toBe('')
  expect(palette.haloTo, `${label}: blue halo`).not.toBe('')

  return { coreIn, coreOut, background }
}

test.describe('colour scheme', () => {
  test('the media-query branch swaps the indicator tokens with the page', async ({
    page,
  }) => {
    await page.goto('/')

    await page.emulateMedia({ colorScheme: 'light' })
    const light = await readPalette(page, '.bento-grid > a')
    const lightRgb = await assertUsablePalette(page, light, 'light')

    await page.emulateMedia({ colorScheme: 'dark' })
    const dark = await readPalette(page, '.bento-grid > a')
    const darkRgb = await assertUsablePalette(page, dark, 'dark')

    /* Page ground flips... */
    expect(luminance(lightRgb.background)).toBeGreaterThan(0.7)
    expect(luminance(darkRgb.background)).toBeLessThan(0.15)

    /* ...and so do the two core bands, so the outermost one always faces the
       page with the opposite lightness. */
    expect(luminance(lightRgb.coreIn)).toBeGreaterThan(0.7)
    expect(luminance(lightRgb.coreOut)).toBeLessThan(0.15)
    expect(luminance(darkRgb.coreIn)).toBeLessThan(0.15)
    expect(luminance(darkRgb.coreOut)).toBeGreaterThan(0.7)

    expect(dark.haloFrom).not.toBe(light.haloFrom)
    expect(dark.haloTo).not.toBe(light.haloTo)
  })

  test('the class branch takes over on the forced-dark photo pages', async ({
    page,
  }) => {
    const detail = await firstGridDetail(page)

    /* OS says light. The page says dark anyway. */
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto(detail!)

    await expect(page.locator('html')).toHaveClass(/\bdark\b/)

    const palette = await readPalette(page, '.image-grid-button')
    const rgb = await assertUsablePalette(page, palette, 'forced dark')

    expect(
      luminance(rgb.background),
      'forced-dark page still painted a light ground',
    ).toBeLessThan(0.15)
    expect(
      luminance(rgb.coreOut),
      'forced-dark page kept the light-mode outer band',
    ).toBeGreaterThan(0.7)

    /* And a plain `dark:` utility resolves through the class branch too. */
    const [buttonBg] = await resolveColors(page, [
      await page
        .locator('.image-grid-button')
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ])
    expect(luminance(buttonBg)).toBeLessThan(0.3)
  })

  test('a forced-dark page looks the same whatever the OS says', async ({
    page,
  }) => {
    const detail = await firstGridDetail(page)
    await page.goto(detail!)

    const sample = async () => {
      const palette = await readPalette(page, '.image-grid-button')
      return await resolveColors(page, [
        palette.coreOut,
        palette.pageBackground,
      ])
    }

    await page.emulateMedia({ colorScheme: 'light' })
    const underLight = await sample()
    await page.emulateMedia({ colorScheme: 'dark' })
    const underDark = await sample()

    expect(underLight).toEqual(underDark)
  })

  test('the non-forced pages follow the OS in both directions', async ({
    page,
  }) => {
    await blockVanDerHub(page)
    for (const path of ['/', '/uses/', '/reads/', '/about/']) {
      await page.goto(path)
      await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)

      const grounds: Rgb[] = []
      for (const scheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme: scheme })
        const [ground] = await resolveColors(page, [
          await page.evaluate(
            () => getComputedStyle(document.body).backgroundColor,
          ),
        ])
        grounds.push(ground)
      }
      expect(luminance(grounds[0]), `${path} in light mode`).toBeGreaterThan(
        0.7,
      )
      expect(luminance(grounds[1]), `${path} in dark mode`).toBeLessThan(0.15)
    }
  })
})

test.describe('reduced motion', () => {
  const focusFirstUsesLink = (page: Page) =>
    page.evaluate(() => {
      const el = document.querySelector('.fancy-list a') as HTMLElement
      el.focus()
      /* Force a style recalc before asking for animations. */
      const boxShadow = getComputedStyle(el).boxShadow
      const animations = el
        .getAnimations({ subtree: true })
        .map((a) => (a as CSSAnimation).animationName ?? a.constructor.name)
      return { boxShadow, animations }
    })

  test('the entry animation is gated, and the ring is at full strength without it', async ({
    page,
  }) => {
    await blockVanDerHub(page)
    await page.goto('/uses/')

    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.keyboard.press('Shift')
    const animated = await focusFirstUsesLink(page)
    expect(
      animated.animations,
      'the entry animation should run by default',
    ).toContain('focus-ring-in')

    await page.waitForFunction(() =>
      (document.querySelector('.fancy-list a') as HTMLElement)
        .getAnimations({ subtree: true })
        .every((a) => a.playState !== 'running'),
    )
    const settled = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector('.fancy-list a')!).boxShadow,
    )

    await blurActiveElement(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.keyboard.press('Shift')
    const reduced = await focusFirstUsesLink(page)

    expect(
      reduced.animations,
      'no keyframe animation may run under reduce',
    ).not.toContain('focus-ring-in')
    /* The ring must not merely stop animating — it has to be fully painted on
       the very first frame, otherwise reduce users get a weaker indicator. */
    expect(reduced.boxShadow).toBe(settled)
    expect(reduced.boxShadow).toContain('4px')
  })

  test('motion-safe decoration is dropped, functional transforms are kept', async ({
    page,
  }) => {
    await page.goto('/grid/')
    const tile = page.locator('.moment').first()

    const hoverState = async () => {
      await tile.hover()
      await page.waitForTimeout(300)
      return tile.evaluate((el) => {
        const style = getComputedStyle(el)
        return { rotate: style.rotate, scale: style.scale }
      })
    }
    const restingRotate = await tile.evaluate(
      (el) => getComputedStyle(el).rotate,
    )

    await page.emulateMedia({ reducedMotion: 'no-preference' })
    const lively = await hoverState()
    await page.mouse.move(2, 2)
    await page.waitForTimeout(300)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    const calm = await hoverState()

    /* The playful extra tilt is `motion-safe:` and must disappear... */
    expect(lively.rotate).not.toBe(restingRotate)
    expect(calm.rotate).toBe(restingRotate)
    /* ...while the scale, which is the actual hover affordance, stays. */
    expect(lively.scale).toBe('1.05')
    expect(calm.scale).toBe('1.05')
  })

  test('the connection indicator stops pulsing under reduce', async ({
    page,
  }) => {
    await blockVanDerHub(page)
    await page.goto('/uses/')

    const dot = page.locator('span.rounded-full[aria-hidden="true"]').first()
    await dot.waitFor()

    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect
      .poll(() => dot.evaluate((el) => el.getAnimations().length))
      .toBeGreaterThan(0)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect
      .poll(() => dot.evaluate((el) => el.getAnimations().length))
      .toBe(0)
  })
})

interface ForcedColorsProbe {
  label: string
  focused: boolean
  outlineStyle: string
  outlineWidth: string
  overlayContent: string | null
}

/**
 * Focus every indicator-bearing element on the current page in turn and report
 * what the browser actually computed for it. One `evaluate` rather than a
 * locator loop because the assertion is about the resolved cascade, not about
 * painted pixels, and because focus has to move between elements without any
 * pointer interaction sneaking in and disarming keyboard modality.
 */
const probeForcedColors = (page: Page) =>
  page.evaluate<ForcedColorsProbe[]>(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.focus-ring, .focus-ring-inset, .focus-ring-overlay',
      ),
    )

    return elements.map((el) => {
      el.focus({ preventScroll: true })
      const style = getComputedStyle(el)
      const name = (
        el.getAttribute('aria-label') ??
        el.getAttribute('title') ??
        el.textContent ??
        ''
      )
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 40)

      return {
        label: `<${el.tagName.toLowerCase()}> ${name} [${el.getAttribute('class')}]`,
        focused: document.activeElement === el,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        overlayContent: el.classList.contains('focus-ring-overlay')
          ? getComputedStyle(el, '::after').content
          : null,
      }
    })
  })

test.describe('forced colors', () => {
  /**
   * Windows High Contrast throws away every background and box-shadow, so the
   * entire indicator is carried by the `@media (forced-colors: active)` outline
   * fallback. That fallback lives in `@layer utilities`, and an *unlayered*
   * `outline` declaration on any of these elements — `focus:outline-none` from
   * a Tailwind `@apply`, say — beats it regardless of specificity and silently
   * leaves the control with no indicator at all.
   */
  test('every indicator falls back to a system outline', async ({ page }) => {
    await blockVanDerHub(page)
    const detail = await firstGridDetail(page)

    for (const path of ['/', '/grid/', '/uses/', detail]) {
      await page.goto(path)
      await page.emulateMedia({ forcedColors: 'active' })
      /* Chromium only arms `:focus-visible` for a scripted focus() when the
         last interaction was a key press. */
      await page.keyboard.press('Shift')

      const probes = await probeForcedColors(page)
      const focusable = probes.filter((probe) => probe.focused)
      expect(
        focusable.length,
        `${path}: no focusable indicator element found`,
      ).toBeGreaterThan(0)

      for (const probe of focusable) {
        expect(
          probe.outlineStyle,
          `${path}: ${probe.label} has no forced-colors outline`,
        ).toBe('solid')
        expect(
          parseFloat(probe.outlineWidth),
          `${path}: ${probe.label} forced-colors outline is too thin`,
        ).toBeGreaterThanOrEqual(3)
        if (probe.overlayContent !== null) {
          expect(
            probe.overlayContent,
            `${path}: ${probe.label} still paints its ::after overlay`,
          ).toBe('none')
        }
      }
    }
  })

  test('the inset ring is untouched when forced colors are off', async ({
    page,
  }) => {
    const detail = await firstGridDetail(page)
    await page.goto(detail)
    await page.emulateMedia({ forcedColors: 'none' })

    const button = page.locator('.image-grid-button').first()
    await focusAsKeyboardUser(button)
    await settleAnimations(button)

    const style = await button.evaluate((el) => {
      const computed = getComputedStyle(el)
      return {
        outlineStyle: computed.outlineStyle,
        boxShadow: computed.boxShadow,
      }
    })

    /* Dropping `focus:outline-none` must not let the UA outline through — the
       layered `.focus-ring-inset:focus-visible { outline: none }` covers it. */
    expect(style.outlineStyle, 'a UA outline leaked through').toBe('none')
    expect(style.boxShadow, 'the inset ring stopped painting').not.toBe('none')
  })
})
