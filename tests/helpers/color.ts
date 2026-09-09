import type { Page } from '@playwright/test'

/**
 * Just enough colour maths to state contrast requirements as contrast
 * requirements, rather than pinning literal hex values that say nothing about
 * whether an indicator is legible.
 *
 * Resolution happens in the page, via a canvas, because computed styles here
 * come back in `oklch()` / `oklab()` (Tailwind 4's palette) and hand-rolling a
 * converter for those would be its own source of bugs.
 */

export type Rgb = [number, number, number]

export async function resolveColors(
  page: Page,
  values: string[],
): Promise<Rgb[]> {
  return page.evaluate((values) => {
    const ctx = new OffscreenCanvas(1, 1).getContext('2d')!
    return values.map((value) => {
      ctx.clearRect(0, 0, 1, 1)
      /* Seed with a sentinel: an unparseable colour leaves fillStyle unchanged,
         which would otherwise be silently mistaken for the requested colour. */
      ctx.fillStyle = '#ff00ff'
      ctx.fillStyle = value
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
      return [r, g, b] as [number, number, number]
    })
  }, values)
}

/** WCAG relative luminance. */
export function luminance([r, g, b]: Rgb): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio, 1 to 21. */
export function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}
