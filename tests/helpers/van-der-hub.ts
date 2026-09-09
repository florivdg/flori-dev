import type { Page } from '@playwright/test'

/**
 * The live backend at van-der-hub.flori.dev is not reachable from CI or from a
 * sandboxed dev machine, so every test that touches it serves its own data.
 * Nothing here asserts anything about the backend — it exists purely so the
 * widgets have something deterministic to render.
 */

export const SSE_URL = 'https://van-der-hub.flori.dev/browser/live'
export const STATS_URL = 'https://van-der-hub.flori.dev/browser/stats'

export interface BrowserStreamController {
  /** Change the value every subsequent reconnect will report. */
  set(bundleId: string): void
  /** How many times the page has (re)connected so far. */
  connections(): number
}

/**
 * Serve the default-browser SSE endpoint.
 *
 * Playwright can only fulfil a route with a complete response, so each
 * connection carries exactly one `data:` frame and then closes; `retry: 60`
 * makes `EventSource` reconnect almost immediately. Every reconnect is served
 * the *same* value until the test calls `set()`, which keeps the widget stable
 * between the assertions and makes each change deliberate — that is what lets a
 * test watch the live region's text actually change from one value to the next.
 */
export async function mockBrowserStream(
  page: Page,
  initial: string,
): Promise<BrowserStreamController> {
  let value = initial
  let connections = 0

  await page.route(`${SSE_URL}**`, async (route) => {
    connections += 1
    await route.fulfill({
      status: 200,
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-store',
        'access-control-allow-origin': '*',
      },
      body: `retry: 60\ndata: ${value}\n\n`,
    })
  })

  return {
    set: (bundleId: string) => {
      value = bundleId
    },
    connections: () => connections,
  }
}

export interface StatsPayload {
  totalEntries: number
  days: number
  browserDistribution: Record<string, number>
  machineDistribution: Record<string, number>
  machineBrowserDistribution: Record<string, Record<string, number>>
  timeSeriesDistribution: Record<string, Record<string, number>>
}

export function sampleStats(): StatsPayload {
  const days = ['2026-09-01', '2026-09-02', '2026-09-03']
  return {
    totalEntries: 240,
    days: 90,
    browserDistribution: {
      'com.apple.Safari': 140,
      'com.google.Chrome': 70,
      'org.mozilla.firefox': 30,
    },
    machineDistribution: { 'Mac13,1': 150, 'Mac14,15': 90 },
    machineBrowserDistribution: {
      'Mac13,1': { 'com.apple.Safari': 100, 'com.google.Chrome': 50 },
      'Mac14,15': {
        'com.apple.Safari': 40,
        'org.mozilla.firefox': 30,
        'com.google.Chrome': 20,
      },
    },
    timeSeriesDistribution: Object.fromEntries(
      days.map((d, i) => [
        d,
        {
          'com.apple.Safari': 40 + i * 5,
          'com.google.Chrome': 25 - i * 3,
          'org.mozilla.firefox': 10 + i,
        },
      ]),
    ),
  }
}

/** Serve the aggregated stats endpoint used by `/uses/browserstats`. */
export async function mockBrowserStats(
  page: Page,
  payload: StatsPayload = sampleStats(),
): Promise<void> {
  await page.route(`${STATS_URL}**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(payload),
    })
  })
}

/** Cut the page off from the backend entirely, for tests that don't care about it. */
export async function blockVanDerHub(page: Page): Promise<void> {
  await page.route('https://van-der-hub.flori.dev/**', (route) => route.abort())
}
