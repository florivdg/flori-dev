<template>
  <div class="@container">
    <div
      class="flex -rotate-1 -skew-x-3 flex-col rounded-lg border border-slate-300 bg-gray-100 p-4 shadow-xl @4xl:flex-row @4xl:items-center @4xl:justify-center @4xl:gap-4 dark:border-slate-700 dark:bg-slate-900"
    >
      <p
        class="fix-bg-clip-text-safari self-center bg-gradient-to-tr from-pink-500 to-sky-500 bg-clip-text !p-2.5 text-center text-6xl font-black text-transparent @xl:self-start @4xl:self-auto @4xl:text-5xl @5xl:text-7xl"
      >
        I'm on
      </p>
      <div
        v-if="browser.bundleId"
        class="my-4 flex aspect-square w-2/3 items-center self-center rounded-2xl bg-white @xl:my-8 @xl:w-60 @4xl:self-auto dark:bg-slate-800"
      >
        <img
          :src="`/icons/${browser.bundleId}.svg`"
          :alt="browser.bundleId"
          class="aspect-square w-full object-contain p-5 @4xl:p-10"
          loading="lazy"
          width="100"
          height="100"
        />
      </div>
      <p
        class="fix-bg-clip-text-safari self-center bg-gradient-to-tl from-pink-500 to-sky-500 bg-clip-text !p-2.5 text-center text-6xl font-black text-transparent @xl:self-end @4xl:self-auto @4xl:text-5xl @5xl:text-7xl"
      >
        right now.
      </p>
    </div>
  </div>
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
    if (delta <= -60 && !browser.error) {
      fetchBrowser()
    }
  },
)
</script>
