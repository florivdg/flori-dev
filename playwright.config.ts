import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end accessibility suite.
 *
 * Chromium only, on purpose: WebKit fails to launch in this environment and
 * Firefox is unverified here, so adding either would produce red runs that say
 * nothing about the site. The assertions below read computed styles and real
 * rendered pixels, both of which are engine-specific anyway — widening the
 * matrix should be a deliberate follow-up, not a default.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    /* Focus rings, dim states and the reduced-motion gate are all measured in
       CSS pixels, so pin the viewport rather than inheriting the machine's. */
    viewport: { width: 1280, height: 900 },
    /* Pin both media features rather than inheriting the host OS, then flip
       them per test with `page.emulateMedia()` where the flip is the subject. */
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        /* After the device spread, so it actually wins. */
        viewport: { width: 1280, height: 900 },
      },
    },
  ],

  /* Self-starting, but never fights the dev server an agent already has up:
     `reuseExistingServer` keeps an existing :4321 listener. ASTRO_DEV_BACKGROUND=0
     stops Astro 7 from detaching the server into the background when it thinks
     it is running under an AI agent — Playwright needs to own the process. */
  webServer: {
    command: 'ASTRO_DEV_BACKGROUND=0 bun run dev',
    url: 'http://localhost:4321/',
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
