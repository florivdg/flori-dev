<template>
  <h2 class="mb-12 flex items-center text-4xl font-black">
    <span>My current browser 👨‍💻</span>
  </h2>
  <p class="mb-8 text-xl">
    {{ browser.bundleId }}
    <span
      v-if="browser.updatedAt"
      class="mt-4 flex items-center justify-end font-mono text-xs font-medium"
      ><span
        title="Live"
        class="mr-2 inline-block h-3 w-3 animate-pulse rounded-full bg-green-600"
      ></span
      ><span>Updated {{ updatedAtLabel }}</span></span
    >
  </p>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import { useTimestamp } from '@vueuse/core'

/**
 * Reactive timestamp for live updates.
 */
const now = useTimestamp({ offset: 0, interval: 1000 })

/**
 * Reactive data fetching.
 */
const browser = reactive<{
  bundleId: string
  isFetching: boolean
  error: boolean
  updatedAt?: Date
}>({
  bundleId: '',
  isFetching: false,
  error: false,
  updatedAt: undefined,
})

/**
 * Fetch the browser ID from Vercel Edge Config.
 */
const fetchBrowser = async () => {
  try {
    /// Set initial fetching state.
    browser.isFetching = true
    browser.error = false

    /// Perform fetch.
    const read = await fetch(
      `https://edge-config.vercel.com/${
        import.meta.env.PUBLIC_VERCEL_EDGE_CONFIG_ID
      }/item/browser?token=${import.meta.env.PUBLIC_VERCEL_EDGE_CONFIG_TOKEN}`,
    )

    /// Set browser ID.
    const bundleId = await read.json()
    browser.bundleId = bundleId

    /// Set updated at.
    browser.updatedAt = new Date()
  } catch (error) {
    browser.error = true
    console.log(error)
  } finally {
    browser.isFetching = false
  }
}

/**
 * Fetch browser on mount.
 */
onMounted(() => {
  fetchBrowser()
})

/**
 * Calculate the delta between now and the updated at date.
 */
const updatedDelta = computed(() => {
  return ((browser.updatedAt?.getTime() ?? 0) - now.value) / 1000
})

/**
 * Format updated at date label.
 */
const updatedAtLabel = computed(() => {
  const formatter = new Intl.RelativeTimeFormat('en', {
    numeric: 'auto',
  })

  return formatter.format(Math.round(updatedDelta.value), 'second')
})

/**
 * Watch for updated delta changes.
 */
watch(
  () => updatedDelta.value,
  (delta) => {
    /// Refetch browser if delta is equal or greater than 60 seconds.
    if (delta <= -60) {
      fetchBrowser()
    }
  },
)
</script>
