import type { Locator, Page } from '@playwright/test'

/**
 * Rendering-based focus-indicator probe.
 *
 * Asserting that an element carries a `.focus-ring` class proves nothing: the
 * class could be dead, the ring could be clipped away by an ancestor's
 * `overflow: hidden`, or it could be painted at the wrong geometry. So these
 * helpers screenshot the region around an element twice — once focused, once
 * not — decode both PNGs inside the page and diff them pixel by pixel. What
 * comes back is where the browser actually put ink.
 */

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface EdgeCounts {
  top: number
  right: number
  bottom: number
  left: number
}

export interface FocusDelta {
  /** Viewport rect of the element while it is focused. */
  rect: Rect
  /** Viewport rect of the same element while it is not focused. */
  restingRect: Rect
  /** How far outside the element the capture reached, in CSS pixels. */
  pad: number
  /**
   * Device pixels per CSS pixel in the capture. Edge counts below are in device
   * pixels while every rect is in CSS pixels, so any assertion about how *dense*
   * a band is has to divide by — or multiply the rect by — this factor to stay
   * independent of `deviceScaleFactor`.
   */
  scale: number
  /** Total number of pixels whose colour changed when the element got focus. */
  changedPixels: number
  /** Bounding box of every changed pixel; `null` when focus changed nothing. */
  changedBox: Rect | null
  /**
   * Changed pixels in the band just *outside* each edge of the element. An
   * outward ring puts ink in all four; one clipped by an ancestor puts ink in
   * none.
   */
  outerEdges: EdgeCounts
  /** Changed pixels in the band just *inside* each edge — the inset variants. */
  innerEdges: EdgeCounts
}

const BAND = 6

const rectsMatch = (a: Rect, b: Rect) =>
  Math.abs(a.x - b.x) < 1 &&
  Math.abs(a.y - b.y) < 1 &&
  Math.abs(a.width - b.width) < 1 &&
  Math.abs(a.height - b.height) < 1

/** True when focusing the element changed its own geometry (e.g. `focus-visible:scale-150`). */
export const focusChangesGeometry = (delta: FocusDelta) =>
  !rectsMatch(delta.rect, delta.restingRect)

/** True when ink appeared on all four sides, either just outside or just inside the box. */
export const ringOnAllEdges = (delta: FocusDelta) => {
  const all = (e: EdgeCounts) =>
    e.top > 0 && e.right > 0 && e.bottom > 0 && e.left > 0
  return all(delta.outerEdges) || all(delta.innerEdges)
}

/** Wait until every animation and transition on the element (and its pseudo elements) has settled. */
export async function settleAnimations(locator: Locator): Promise<void> {
  await locator.evaluate(async (el) => {
    await Promise.all(
      el
        .getAnimations({ subtree: true })
        .map((a) => a.finished.catch(() => {})),
    )
  })
  await nextFrames(locator.page())
}

async function nextFrames(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  )
}

/**
 * Wait for fonts and for any image currently on screen, so two captures of the
 * same region render identically. Off-screen `loading="lazy"` images never
 * complete, so only visible ones are awaited, and the wait is capped.
 */
export async function settlePage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const capped = (p: Promise<unknown>) =>
      Promise.race([p, new Promise((resolve) => setTimeout(resolve, 3000))])

    const onScreen = (img: HTMLImageElement) => {
      const r = img.getBoundingClientRect()
      return r.bottom > -200 && r.top < window.innerHeight + 200 && r.width > 0
    }

    await capped(document.fonts.ready)
    await capped(
      Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete && onScreen(img))
          .map(
            (img) =>
              new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true })
                img.addEventListener('error', () => resolve(), { once: true })
              }),
          ),
      ),
    )
  })
  await nextFrames(page)
}

/** Drop focus to the body without disturbing Chromium's keyboard-modality flag. */
export async function blurActiveElement(page: Page): Promise<void> {
  await page.evaluate(() => {
    const active = document.activeElement
    if (active instanceof HTMLElement) active.blur()
  })
}

/**
 * Focus an element the way a keyboard user would, as far as `:focus-visible` is
 * concerned. Chromium only arms `:focus-visible` for a scripted `focus()` when
 * the most recent user interaction was a key press, so press a harmless key
 * first. Verified in-browser: without the key press the ring never paints.
 */
export async function focusAsKeyboardUser(locator: Locator): Promise<void> {
  await locator.page().keyboard.press('Shift')
  await locator.evaluate((el: HTMLElement) => el.focus({ preventScroll: true }))
}

const readRect = (locator: Locator) =>
  locator.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  })

/** Scroll so the element plus its ring margin sits fully inside the viewport when it can. */
async function scrollFullyIntoView(
  locator: Locator,
  pad: number,
): Promise<void> {
  await locator.scrollIntoViewIfNeeded()
  await locator.evaluate((el, pad) => {
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight
    if (r.height + pad * 2 > vh) return
    if (r.top - pad < 0) window.scrollBy(0, r.top - pad)
    else if (r.bottom + pad > vh) window.scrollBy(0, r.bottom + pad - vh)
  }, pad)
  await nextFrames(locator.page())
}

function clipFor(
  rect: Rect,
  pad: number,
  viewport: { width: number; height: number },
) {
  const x = Math.max(0, Math.floor(rect.x - pad))
  const y = Math.max(0, Math.floor(rect.y - pad))
  return {
    x,
    y,
    width: Math.min(viewport.width, Math.ceil(rect.x + rect.width + pad)) - x,
    height:
      Math.min(viewport.height, Math.ceil(rect.y + rect.height + pad)) - y,
  }
}

async function shoot(
  page: Page,
  clip: { x: number; y: number; width: number; height: number },
) {
  return (await page.screenshot({ clip, animations: 'disabled' })).toString(
    'base64',
  )
}

async function diffCaptures(
  page: Page,
  before: string,
  after: string,
  clip: { x: number; y: number; width: number; height: number },
  rect: Rect,
) {
  return page.evaluate(
    async ({ before, after, clip, rect, band }) => {
      const decode = async (b64: string) => {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
        const bitmap = await createImageBitmap(
          new Blob([bytes], { type: 'image/png' }),
        )
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(bitmap, 0, 0)
        const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data
        return { data, w: bitmap.width, h: bitmap.height }
      }

      const a = await decode(before)
      const b = await decode(after)
      if (a.w !== b.w || a.h !== b.h) throw new Error('capture size mismatch')

      /* Screenshots arrive in device pixels; map back to CSS pixels so callers
         can compare against getBoundingClientRect() directly. */
      const scale = a.w / clip.width

      let changedPixels = 0
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      const outerEdges = { top: 0, right: 0, bottom: 0, left: 0 }
      const innerEdges = { top: 0, right: 0, bottom: 0, left: 0 }

      const l = rect.x
      const r = rect.x + rect.width
      const t = rect.y
      const bo = rect.y + rect.height

      for (let py = 0; py < a.h; py++) {
        for (let px = 0; px < a.w; px++) {
          const i = (py * a.w + px) * 4
          const delta =
            Math.abs(a.data[i] - b.data[i]) +
            Math.abs(a.data[i + 1] - b.data[i + 1]) +
            Math.abs(a.data[i + 2] - b.data[i + 2])
          /* 12 summed across channels ignores subpixel/AA jitter but sits far
             below anything a real indicator paints. */
          if (delta <= 12) continue

          changedPixels++
          const cx = clip.x + px / scale
          const cy = clip.y + py / scale
          if (cx < minX) minX = cx
          if (cy < minY) minY = cy
          if (cx > maxX) maxX = cx
          if (cy > maxY) maxY = cy

          const spansH = cx >= l - 0.5 && cx <= r + 0.5
          const spansV = cy >= t - 0.5 && cy <= bo + 0.5

          if (spansH && cy < t - 0.5 && cy >= t - band) outerEdges.top++
          if (spansH && cy > bo + 0.5 && cy <= bo + band) outerEdges.bottom++
          if (spansV && cx < l - 0.5 && cx >= l - band) outerEdges.left++
          if (spansV && cx > r + 0.5 && cx <= r + band) outerEdges.right++

          if (spansH && cy >= t - 0.5 && cy <= t + band) innerEdges.top++
          if (spansH && cy <= bo + 0.5 && cy >= bo - band) innerEdges.bottom++
          if (spansV && cx >= l - 0.5 && cx <= l + band) innerEdges.left++
          if (spansV && cx <= r + 0.5 && cx >= r - band) innerEdges.right++
        }
      }

      return {
        scale,
        changedPixels,
        changedBox:
          changedPixels === 0
            ? null
            : {
                x: minX,
                y: minY,
                width: maxX - minX + 1 / scale,
                height: maxY - minY + 1 / scale,
              },
        outerEdges,
        innerEdges,
      }
    },
    { before, after, clip, rect, band: BAND },
  )
}

/**
 * Screenshot the area around `locator` focused and unfocused, then diff the two
 * inside the page. The focused rect is measured first, because some indicators
 * (the skip link) only take up space once focused.
 */
export async function measureFocusDelta(
  locator: Locator,
  options: { pad?: number } = {},
): Promise<FocusDelta> {
  const pad = options.pad ?? 10
  const page = locator.page()
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('measureFocusDelta needs a fixed viewport')

  await scrollFullyIntoView(locator, pad)
  await settlePage(page)

  await focusAsKeyboardUser(locator)
  await settleAnimations(locator)
  const rect = await readRect(locator)
  const clip = clipFor(rect, pad, viewport)
  const after = await shoot(page, clip)

  await blurActiveElement(page)
  await settleAnimations(locator)
  const restingRect = await readRect(locator)
  const before = await shoot(page, clip)

  const diff = await diffCaptures(page, before, after, clip, rect)
  return { rect, restingRect, pad, ...diff }
}

/**
 * Same measurement, but for whatever is focused right now — used while walking
 * the tab order, so the walk is driven by real `Tab` presses. Focus is restored
 * afterwards so the walk can continue from the same place.
 */
export async function measureFocusDeltaOfActive(
  page: Page,
  options: { pad?: number } = {},
): Promise<FocusDelta> {
  const pad = options.pad ?? 8
  const viewport = page.viewportSize()
  if (!viewport)
    throw new Error('measureFocusDeltaOfActive needs a fixed viewport')

  const handle = await page.evaluateHandle(
    () => document.activeElement as HTMLElement,
  )

  const settle = () =>
    page.evaluate(async (el) => {
      await Promise.all(
        el
          .getAnimations({ subtree: true })
          .map((a) => a.finished.catch(() => {})),
      )
    }, handle)
  const rectOf = () =>
    page.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height }
    }, handle)

  await settle()
  await nextFrames(page)
  const rect = await rectOf()
  const clip = clipFor(rect, pad, viewport)
  const after = await shoot(page, clip)

  await page.evaluate((el) => el.blur(), handle)
  await settle()
  await nextFrames(page)
  const restingRect = await rectOf()
  const before = await shoot(page, clip)

  await page.evaluate((el) => el.focus({ preventScroll: true }), handle)
  await handle.dispose()

  const diff = await diffCaptures(page, before, after, clip, rect)
  return { rect, restingRect, pad, ...diff }
}

/** Is the whole padded capture region inside the viewport? Edge checks only mean something if it is. */
export function paddedBoxIsOnScreen(
  delta: FocusDelta,
  viewport: { width: number; height: number },
): boolean {
  const { rect, pad } = delta
  return (
    rect.x - pad >= 0 &&
    rect.y - pad >= 0 &&
    rect.x + rect.width + pad <= viewport.width &&
    rect.y + rect.height + pad <= viewport.height
  )
}
