import { test, expect } from './helpers/test'
import type { Page } from '@playwright/test'
import { firstGridDetail } from './helpers/routes'

/**
 * The photo detail info panel.
 *
 * A disclosure is only usable from the keyboard if three things line up: the
 * trigger reports its state, it points at the thing it controls, and the
 * controlled region is genuinely gone from the accessibility tree while it is
 * closed. All three are read from the live DOM here, including the computed
 * `display` — `aria-expanded="false"` on a panel that is merely translated off
 * screen is a lie a screen reader still walks into.
 */

const openPhotoDetail = async (page: Page) => {
  const href = await firstGridDetail(page)
  await page.goto(href)
  return href
}

const toggle = (page: Page) =>
  page.getByRole('button', { name: /photograph details/ })
const panel = (page: Page) => page.locator('#grid-info-panel')

/** The panel animates in and out over up to 700ms; poll rather than sleep. */
const expectPanelOpen = async (page: Page, open: boolean) => {
  await expect(toggle(page)).toHaveAttribute('aria-expanded', String(open))
  await expect
    .poll(() => panel(page).evaluate((el) => getComputedStyle(el).display))
    .toBe(open ? 'block' : 'none')
}

test.describe('photo info disclosure', () => {
  test.beforeEach(async ({ page }) => {
    await openPhotoDetail(page)
  })

  test('the trigger points at a region that really exists', async ({
    page,
  }) => {
    const button = toggle(page)
    await expect(button).toHaveAttribute('aria-controls', 'grid-info-panel')

    const controlled = await button.evaluate((el) => {
      const id = el.getAttribute('aria-controls')!
      const target = document.getElementById(id)
      return {
        exists: !!target,
        role: target?.getAttribute('role') ?? null,
        label: target?.getAttribute('aria-label') ?? null,
      }
    })

    expect(controlled.exists, 'aria-controls points at a missing element').toBe(
      true,
    )
    expect(controlled.role).toBe('region')
    expect(controlled.label).toBe('Photo details')
  })

  test('starts collapsed, with the panel out of the tree', async ({ page }) => {
    await expectPanelOpen(page, false)

    /* Nothing inside a closed panel may be tabbable. */
    const reachable = await page.evaluate(() => {
      const p = document.getElementById('grid-info-panel')!
      return Array.from(p.querySelectorAll('a, button, [tabindex]')).filter(
        (el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height > 0
        },
      ).length
    })
    expect(reachable).toBe(0)
  })

  test('the trigger toggles state, name and panel together', async ({
    page,
  }) => {
    const button = toggle(page)
    await expect(button).toHaveAccessibleName('Show photograph details')
    await expectPanelOpen(page, false)

    await button.click()
    await expect(button).toHaveAccessibleName('Hide photograph details')
    await expectPanelOpen(page, true)
    await expect(panel(page).getByRole('heading', { level: 2 })).toBeVisible()

    await button.click()
    await expect(button).toHaveAccessibleName('Show photograph details')
    await expectPanelOpen(page, false)
  })

  test('the trigger works from the keyboard and keeps focus', async ({
    page,
  }) => {
    const button = toggle(page)
    await button.focus()
    await page.keyboard.press('Enter')
    await expectPanelOpen(page, true)
    await expect(button).toBeFocused()

    await page.keyboard.press('Space')
    await expectPanelOpen(page, false)
    await expect(button).toBeFocused()
  })

  test('Escape closes the panel and reports it', async ({ page }) => {
    const button = toggle(page)
    await button.click()
    await expectPanelOpen(page, true)

    await page.keyboard.press('Escape')
    await expectPanelOpen(page, false)
  })

  test('Escape on an already closed panel is harmless', async ({ page }) => {
    await expectPanelOpen(page, false)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    await expectPanelOpen(page, false)
    expect(page.url()).toContain('/grid/')
  })

  test('the "i" shortcut and the button report the same state', async ({
    page,
  }) => {
    await page.keyboard.press('i')
    await expectPanelOpen(page, true)

    await page.keyboard.press('i')
    await expectPanelOpen(page, false)
  })

  test('the open panel exposes its content, and closing removes it again', async ({
    page,
  }) => {
    await toggle(page).click()
    await expectPanelOpen(page, true)

    /* The icon-only table rows carry visually hidden labels; without them the
       EXIF table reads as a column of bare numbers. */
    for (const label of [
      'Camera',
      'Lens',
      'Aperture',
      'Focal length',
      'Shutter Speed',
      'ISO',
    ]) {
      await expect(panel(page).getByText(label, { exact: true })).toHaveCount(1)
    }

    const decorative = await panel(page).evaluate((el) =>
      Array.from(el.querySelectorAll('svg')).every(
        (svg) => svg.getAttribute('aria-hidden') === 'true',
      ),
    )
    expect(
      decorative,
      'decorative icons inside the panel must be aria-hidden',
    ).toBe(true)

    await page.keyboard.press('Escape')
    await expectPanelOpen(page, false)
  })
})

test.describe('photo detail chrome', () => {
  test('every control has an accessible name', async ({ page }) => {
    await openPhotoDetail(page)

    await expect(
      page.getByRole('link', { name: 'Go back to the photo grid' }),
    ).toHaveCount(1)
    await expect(
      page.getByRole('button', { name: 'Show photograph details' }),
    ).toHaveCount(1)
    await expect(
      page.getByRole('link', { name: 'Go to previous photo' }),
    ).toHaveCount(1)
    await expect(
      page.getByRole('link', { name: 'Go to next photo' }),
    ).toHaveCount(1)

    const unnamed = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll('main a, main button')).filter(
          (el) => {
            const text = (el.textContent ?? '').trim()
            return (
              !text &&
              !el.getAttribute('aria-label') &&
              !el.getAttribute('title')
            )
          },
        ).length,
    )
    expect(unnamed).toBe(0)
  })

  test('the photo itself carries real alternative text', async ({ page }) => {
    await openPhotoDetail(page)
    const alts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('main img')).map((img) =>
        img.getAttribute('alt'),
      ),
    )
    expect(alts.length).toBeGreaterThan(0)
    for (const alt of alts) {
      expect(alt).not.toBeNull()
      expect(alt!.trim().length).toBeGreaterThan(10)
    }
  })
})
