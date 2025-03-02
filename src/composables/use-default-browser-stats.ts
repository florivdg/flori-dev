import { onMounted, ref } from 'vue'
import type { DefaultBrowserStats } from '../types/DefaultBrowserStats'

export function useDefaultBrowserStats() {
  const stats = ref<DefaultBrowserStats | undefined>(undefined)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchStats = async (days = 30) => {
    loading.value = true
    error.value = null

    try {
      const url = new URL('https://van-der-hub.flori.dev/browser/stats')
      url.searchParams.set('days', days.toString())
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

  return { stats, fetchStats, loading, error }
}
