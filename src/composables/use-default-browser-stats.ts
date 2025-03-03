import { onMounted, ref, watch } from 'vue'
import type { DefaultBrowserStats } from '../types/DefaultBrowserStats'

export function useDefaultBrowserStats() {
  const stats = ref<DefaultBrowserStats | undefined>(undefined)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const limit = ref(30)

  const fetchStats = async () => {
    loading.value = true
    error.value = null

    try {
      const url = new URL('https://van-der-hub.flori.dev/browser/stats')
      url.searchParams.set('days', limit.value.toString())
      const response = await fetch(url)
      stats.value = await response.json()
    } catch (err) {
      error.value = (err as Error).message ?? 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchStats()
  })

  watch(limit, () => {
    fetchStats()
  })

  return { stats, fetchStats, limit, loading, error }
}

/**
 * List of valid browser bundle ids for that exist icons.
 */
export const validBrowserBundleIds = {
  'com.apple.Safari': 'Safari',
  'com.apple.SafariTechnologyPreview': 'Safari Technology Preview',
  'com.google.Chrome': 'Chrome',
  'com.microsoft.edgemac': 'Edge',
  'org.mozilla.firefox': 'Firefox',
  'company.thebrowser.Browser': 'Arc',
}
