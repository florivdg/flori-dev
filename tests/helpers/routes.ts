import type { Page } from '@playwright/test'

/**
 * Every route shape the site serves.
 *
 * `chrome: false` marks the pages built on the bare `Basic` layout — the photo
 * detail view deliberately ships no header, primary nav or footer, so the
 * landmark expectations for it are different rather than merely relaxed.
 */
export interface RouteSpec {
  name: string
  path?: string
  /** For the two collection detail shapes, whose slugs are content-dependent. */
  resolve?: (page: Page) => Promise<string>
  chrome: boolean
  /** Pages whose main content only exists once client-side data has arrived. */
  ready?: (page: Page) => Promise<void>
}

export const firstGridDetail = async (page: Page) => {
  await page.goto('/grid/')
  const href = await page
    .locator('a[data-grid-link]')
    .first()
    .getAttribute('href')
  if (!href) throw new Error('no photo links on /grid/')
  return href
}

export const firstArticle = async (page: Page) => {
  await page.goto('/reads/')
  const href = await page
    .locator('main article a[href^="/reads/"], main a[href^="/reads/"]')
    .first()
    .getAttribute('href')
  if (!href) throw new Error('no article links on /reads/')
  return href
}

export const ROUTES: RouteSpec[] = [
  { name: 'home', path: '/', chrome: true },
  { name: 'grid index', path: '/grid/', chrome: true },
  { name: 'reads index', path: '/reads/', chrome: true },
  { name: 'uses', path: '/uses/', chrome: true },
  {
    name: 'browser stats',
    path: '/uses/browserstats',
    chrome: true,
    ready: async (page) => {
      await page.getByText('Total default updates').first().waitFor()
    },
  },
  { name: 'about', path: '/about/', chrome: true },
  { name: 'imprint', path: '/imprint/', chrome: true },
  { name: 'privacy policy', path: '/privacy-policy/', chrome: true },
  { name: 'photo detail', resolve: firstGridDetail, chrome: false },
  { name: 'article', resolve: firstArticle, chrome: true },
]

export async function gotoRoute(page: Page, route: RouteSpec): Promise<string> {
  const path = route.path ?? (await route.resolve!(page))
  await page.goto(path)
  await route.ready?.(page)
  return path
}

/**
 * Wait until every Astro island on the page has hydrated.
 *
 * Astro renders `<astro-island ssr="">` server-side and removes the `ssr`
 * attribute once the component is mounted. Interactive behaviour backed by an
 * island — the photo pages' arrow-key navigation, for instance — is inert until
 * then, and `toHaveURL` resolves on the URL change, which happens earlier. Under
 * a loaded test run that gap is wide enough to swallow a key press.
 */
export async function islandsHydrated(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      document.readyState !== 'loading' &&
      document.querySelectorAll('astro-island[ssr]').length === 0,
  )
}
