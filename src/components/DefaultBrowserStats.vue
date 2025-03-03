<template>
  <div class="bar-chart">
    <div
      v-for="(count, browser) in browserData"
      :key="browser"
      class="bar-container"
    >
      <div class="bar-wrapper">
        <div
          class="bar"
          :style="{
            width: computedWidth(count) + '%',
            backgroundColor:
              browserColors[browser as keyof typeof validBrowserBundleIds] ||
              defaultColor,
          }"
        ></div>
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

/* Compute the overall browser distribution */
const browserData = computed(() => stats.value?.browserDistribution)

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
</script>

<style scoped>
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 600px;
  margin: auto;
  padding: 1rem;
}

.bar-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.label {
  width: 150px;
  font-weight: bold;
  text-align: right;
}

.bar-wrapper {
  flex-grow: 1;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 24px;
  transition: width 1s ease-out;
  border-radius: 4px;
}
</style>
