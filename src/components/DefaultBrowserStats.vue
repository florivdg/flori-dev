<template>
  <div class="mx-auto flex flex-col gap-4 p-4">
    <div class="overflow-hidden rounded bg-gray-100">
      <div class="flex h-6 w-full">
        <div
          v-for="(count, browser) in browserData"
          :key="browser"
          class="flex h-full items-center justify-center text-xs font-medium text-white"
          :style="{
            width: computedWidth(count) + '%',
            backgroundColor:
              browserColors[browser as keyof typeof validBrowserBundleIds] ||
              defaultColor,
          }"
          :title="`${browser}: ${count}`"
        >
          {{ formatBrowserName(browser) }}
        </div>
      </div>
    </div>
    <div class="flex flex-wrap gap-4 text-sm">
      <div
        v-for="(count, browser) in browserData"
        :key="browser"
        class="flex items-center gap-1"
      >
        <div
          class="h-3 w-3 rounded-sm"
          :style="{
            backgroundColor:
              browserColors[browser as keyof typeof validBrowserBundleIds] ||
              defaultColor,
          }"
        ></div>
        <span>{{ formatBrowserName(browser) }}: {{ count }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  useDefaultBrowserStats,
  validBrowserBundleIds,
} from '../composables/use-default-browser-stats'

/**
 * Get the default browser stats.
 */
const { stats, loading, fetchStats, limit, error } = useDefaultBrowserStats()

/* Compute the overall browser distribution and sort by count (highest first) */
const browserData = computed(() => {
  if (!stats.value?.browserDistribution) return {}

  // Convert the object to array of [browser, count] pairs
  const entries = Object.entries(stats.value.browserDistribution)

  // Sort by count in descending order
  entries.sort((a, b) => b[1] - a[1])

  // Convert back to object
  return Object.fromEntries(entries)
})

/* Compute the maximum count (for scaling bar widths) */
const maxCount = computed(() => {
  if (browserData.value === undefined) return 1
  const counts = Object.values(browserData.value)
  return counts.length ? Math.max(...counts) : 1
})

/* A mapping from browser key to a color for the chart */
const browserColors: Record<keyof typeof validBrowserBundleIds, string> = {
  'com.apple.Safari': '#00aef0',
  'com.google.Chrome': '#fcbd22',
  'org.mozilla.firefox': '#ff3b44',
  'com.apple.SafariTechnologyPreview': '#622888',
  'company.thebrowser.Browser': '#0035fe',
  'com.microsoft.edgemac': '#4ad78b',
}
const defaultColor = '#CCCCCC'

/* A helper to compute the width percentage for a given count */
const computedWidth = (count: number) => (count / maxCount.value) * 100

/* Format browser bundle ID to a more readable name */
const formatBrowserName = (
  bundleId: string | keyof typeof validBrowserBundleIds,
): string => {
  const nameMap: Record<keyof typeof validBrowserBundleIds, string> = {
    'com.apple.Safari': 'Safari',
    'com.google.Chrome': 'Chrome',
    'org.mozilla.firefox': 'Firefox',
    'com.apple.SafariTechnologyPreview': 'Safari TP',
    'company.thebrowser.Browser': 'Arc',
    'com.microsoft.edgemac': 'Edge',
  }

  return nameMap[bundleId] || bundleId.split('.').pop() || bundleId
}
</script>
