export const browserBundleMap = {
  'com.apple.Safari': 'Safari',
  'com.google.Chrome': 'Chrome',
  'org.mozilla.firefox': 'Firefox',
  'company.thebrowser.dia': 'Dia',
  'app.zen-browser.zen': 'Zen',
  'com.apple.SafariTechnologyPreview': 'Safari TP',
  'com.microsoft.edgemac': 'Edge',
  'company.thebrowser.Browser': 'Arc',
  'net.imput.helium': 'Helium',
} as const

export type BrowserBundleId = keyof typeof browserBundleMap

export const getBrowserLabel = (bundleId: string) =>
  browserBundleMap[bundleId as BrowserBundleId] ?? null
