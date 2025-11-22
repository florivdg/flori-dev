<template>
  <section class="flex flex-col gap-8">
    <header
      class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Browser stats
        </p>
        <h2 class="mt-2 text-3xl font-black text-slate-900 dark:text-white">
          Usage insights from my machines
        </h2>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Pulled directly from van-der-hub and refreshed whenever you switch the time span.
        </p>
      </div>

      <label class="flex flex-col gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        Time span
        <select
          v-model.number="selectedRange"
          class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-medium text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:min-w-[220px] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-sky-500/40"
        >
          <option v-for="option in timeframeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
    </header>

    <div
      v-if="errorMessage"
      class="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
    >
      <p class="font-semibold">Unable to load stats</p>
      <p class="mt-2 text-sm">
        {{ errorMessage }}
      </p>
      <button
        type="button"
        class="mt-4 inline-flex items-center rounded-lg border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-900/20 dark:border-white/10 dark:bg-transparent dark:text-white dark:hover:border-white/30"
        @click="fetchStats"
      >
        Try again
      </button>
    </div>

    <div v-else>
      <div
        v-if="!stats && isLoading"
        class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
      >
        Loading usage details…
      </div>

      <div
        v-else-if="stats"
        class="flex flex-col gap-8"
      >
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="card in summaryCards"
            :key="card.label"
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/40"
          >
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {{ card.label }}
            </p>
            <p class="mt-3 text-3xl font-black text-slate-900 dark:text-white">
              {{ card.value }}
            </p>
            <p
              v-if="card.helper"
              class="mt-1 text-sm text-slate-600 dark:text-slate-400"
            >
              {{ card.helper }}
            </p>
          </article>
        </section>

        <section class="grid gap-8 xl:grid-cols-2">
          <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">Browser distribution</p>
                <p class="text-lg font-bold text-slate-900 dark:text-white">What I actually click on</p>
              </div>
              <span
                class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                {{ totalEntries }} sessions
              </span>
            </div>

            <div class="mt-4">
              <DonutChart
                v-if="browserDonut.data.length"
                :data="browserDonut.data"
                :height="320"
                :arc-width="32"
                :radius="0"
                :categories="browserDonut.categories"
                :legend-position="LegendPosition.BottomCenter"
              />

              <p
                v-else
                class="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400"
              >
                No browser breakdown available for this time span.
              </p>
            </div>
          </article>

          <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">Machines</p>
                <p class="text-lg font-bold text-slate-900 dark:text-white">Where those sessions originated</p>
              </div>
            </div>

            <div class="mt-4">
              <BarChart
                v-if="machineChartData.data.length"
                :data="machineChartData.data"
                :height="machineChartData.height"
                :categories="machineChartData.categories"
                :y-axis="['sessions']"
                :x-axis="'machine'"
                :orientation="Orientation.Horizontal"
                :x-grid-line="false"
                :legend-position="LegendPosition.BottomLeft"
                :x-formatter="formatMachineLabel"
                :y-formatter="formatCountLabel"
                hide-tooltip
              />
              <p
                v-else
                class="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400"
              >
                No machine level details for this range.
              </p>
            </div>
          </article>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">Time series</p>
              <p class="text-lg font-bold text-slate-900 dark:text-white">Every hit across the selected window</p>
            </div>
            <span
              v-if="timeSeriesWindow"
              class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {{ timeSeriesWindow }}
            </span>
          </div>

          <div class="mt-4">
            <BarChart
              v-if="timeSeriesChart.data.length && Object.keys(timeSeriesChart.categories).length"
              :data="timeSeriesChart.data"
              :height="420"
              :stacked="true"
              :categories="timeSeriesChart.categories"
              :y-axis="timeSeriesChart.yAxisKeys"
              :x-axis="'date'"
              :group-padding="4"
              :bar-padding="0.15"
              :radius="2"
              :legend-position="LegendPosition.BottomCenter"
              :y-grid-line="true"
              :x-grid-line="false"
              :x-formatter="formatTimeSeriesTick"
              :y-formatter="formatCountLabel"
              hide-tooltip
            />

            <p
              v-else
              class="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400"
            >
              No time series data was returned for this selection.
            </p>
          </div>
        </section>

        <section
          v-if="machineBreakdown.length"
          class="grid gap-4 md:grid-cols-2"
        >
          <article
            v-for="machine in machineBreakdown"
            :key="machine.id"
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/40"
          >
            <div class="flex items-baseline justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {{ machine.id }}
                </p>
                <p class="text-xl font-bold text-slate-900 dark:text-white">
                  {{ machine.sessions }} sessions
                </p>
              </div>
              <p class="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {{ machine.share }}
              </p>
            </div>

            <ul class="mt-4 space-y-2">
              <li
                v-for="browser in machine.browsers"
                :key="browser.id"
                class="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300"
              >
                <span class="flex items-center gap-2">
                  <span
                    class="h-2.5 w-2.5 rounded-full"
                    :style="{ backgroundColor: browser.color }"
                  ></span>
                  {{ browser.name }}
                </span>
                <span class="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {{ browser.count }} ({{ browser.share }})
                </span>
              </li>
            </ul>
          </article>
        </section>
      </div>

      <div
        v-else
        class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
      >
        No stats were returned for this time selection.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { BarChart, DonutChart, LegendPosition, Orientation } from 'vue-chrts'

interface BrowserStatsResponse {
  totalEntries: number
  days: number
  browserDistribution: Record<string, number>
  machineDistribution: Record<string, number>
  machineBrowserDistribution: Record<string, Record<string, number>>
  timeSeriesDistribution: Record<string, Record<string, number>>
}

interface TimeframeOption {
  label: string
  value: number
}

interface SummaryCard {
  label: string
  value: string
  helper?: string
}

interface DonutDataset {
  data: number[]
  categories: Record<string, { name: string; color?: string }>
}

interface MachineChartDataset {
  data: Array<{ machine: string; sessions: number }>
  height: number
  categories: Record<string, { name: string; color?: string }>
}

interface TimeSeriesDatum {
  date: number
  [browserId: string]: number
}

interface TimeSeriesChartDataset {
  data: TimeSeriesDatum[]
  categories: Record<string, { name: string; color: string }>
  yAxisKeys: string[]
}

interface MachineBreakdownItem {
  id: string
  sessions: number
  share: string
  browsers: Array<{
    id: string
    name: string
    count: number
    share: string
    color: string
  }>
}

const STATS_ENDPOINT = 'https://van-der-hub.flori.dev/browser/stats'

const timeframeOptions: TimeframeOption[] = [
  { label: 'Last 24 hours', value: 1 },
  { label: 'Last week', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
  { label: 'Last year', value: 365 },
]

const selectedRange = ref<number>(90)
const stats = ref<BrowserStatsResponse | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const abortController = ref<AbortController | null>(null)

const numberFormatter = new Intl.NumberFormat('en-US')

const knownBrowserNames: Record<string, string> = {
  'com.apple.Safari': 'Safari',
  'com.apple.SafariTechnologyPreview': 'Safari Technology Preview',
  'com.brave.Browser': 'Brave',
  'com.google.Chrome': 'Chrome',
  'com.google.Chrome.canary': 'Chrome Canary',
  'org.mozilla.firefox': 'Firefox',
  'company.thebrowser.dia': 'Arc',
  'company.thebrowser.Browser': 'Arc',
}

const knownBrowserColors: Record<string, string> = {
  'com.apple.Safari': '#0ea5e9',
  'com.apple.SafariTechnologyPreview': '#38bdf8',
  'com.google.Chrome': '#facc15',
  'com.google.Chrome.canary': '#fb7185',
  'org.mozilla.firefox': '#f97316',
  'company.thebrowser.dia': '#c026d3',
  'company.thebrowser.Browser': '#c026d3',
  'com.brave.Browser': '#ea580c',
}

const fallbackColors = [
  '#8b5cf6',
  '#14b8a6',
  '#ef4444',
  '#22d3ee',
  '#f472b6',
  '#2dd4bf',
  '#f97316',
  '#2563eb',
  '#0f172a',
]

const dynamicBrowserColors = new Map<string, string>()
let fallbackIndex = 0

const getBrowserColor = (id: string) => {
  if (knownBrowserColors[id]) return knownBrowserColors[id]

  if (!dynamicBrowserColors.has(id)) {
    dynamicBrowserColors.set(id, fallbackColors[fallbackIndex % fallbackColors.length])
    fallbackIndex += 1
  }

  return dynamicBrowserColors.get(id) as string
}

const formatBrowserName = (bundleId: string) => {
  if (knownBrowserNames[bundleId]) return knownBrowserNames[bundleId]
  const segments = bundleId.split('.')
  return segments[segments.length - 1] ?? bundleId
}

const fetchStats = async () => {
  abortController.value?.abort()
  const controller = new AbortController()
  abortController.value = controller

  try {
    isLoading.value = true
    errorMessage.value = null
    const response = await fetch(`${STATS_ENDPOINT}?days=${selectedRange.value}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) throw new Error(`Request failed with status ${response.status}`)

    const payload = (await response.json()) as BrowserStatsResponse
    stats.value = payload
  } catch (error) {
    if ((error as DOMException).name === 'AbortError') return
    errorMessage.value = (error as Error)?.message ?? 'Something went wrong while loading the stats.'
  } finally {
    if (!controller.signal.aborted) {
      isLoading.value = false
    }
  }
}

const totalEntries = computed(() => stats.value?.totalEntries ?? 0)

const summaryCards = computed<SummaryCard[]>(() => {
  if (!stats.value) return []

  const sortedBrowsers = Object.entries(stats.value.browserDistribution).sort(
    (a, b) => b[1] - a[1],
  )
  const [topBrowserId, topBrowserCount] = sortedBrowsers[0] ?? []
  const topBrowserShare =
    topBrowserId && totalEntries.value
      ? `${formatBrowserName(topBrowserId)} (${formatPercent(topBrowserCount / totalEntries.value)})`
      : '–'

  return [
    {
      label: 'Total sessions',
      value: numberFormatter.format(totalEntries.value),
      helper: `${stats.value.days} days tracked`,
    },
    {
      label: 'Unique browsers',
      value: numberFormatter.format(sortedBrowsers.length),
    },
    {
      label: 'Top browser',
      value: topBrowserShare,
      helper: topBrowserId ? 'Most used client by raw hits' : undefined,
    },
    {
      label: 'Machines online',
      value: numberFormatter.format(Object.keys(stats.value.machineDistribution ?? {}).length),
    },
  ]
})

const browserDonut = computed<DonutDataset>(() => {
  if (!stats.value) return { data: [], categories: {} }

  const entries = Object.entries(stats.value.browserDistribution).sort((a, b) => b[1] - a[1])
  const data = entries.map(([, count]) => count)
  const categories = Object.fromEntries(
    entries.map(([browserId], index) => [
      browserId,
      { name: formatBrowserName(browserId), color: getBrowserColor(browserId) },
    ]),
  )

  return { data, categories }
})

const machineChartData = computed<MachineChartDataset>(() => {
  if (!stats.value) {
    return {
      data: [],
      height: 260,
      categories: { sessions: { name: 'Sessions', color: '#6366f1' } },
    }
  }

  const entries = Object.entries(stats.value.machineDistribution ?? {})
    .map(([machine, sessions]) => ({
      machine,
      sessions,
    }))
    .sort((a, b) => b.sessions - a.sessions)

  return {
    data: entries,
    height: Math.max(220, entries.length * 48),
    categories: {
      sessions: {
        name: 'Sessions',
        color: '#6366f1',
      },
    },
  }
})

const timeSeriesChart = computed<TimeSeriesChartDataset>(() => {
  if (!stats.value) {
    return { data: [], categories: {}, yAxisKeys: [] }
  }

  const allBrowserIds = new Set<string>()
  Object.values(stats.value.timeSeriesDistribution ?? {}).forEach((distribution) => {
    Object.keys(distribution).forEach((browser) => allBrowserIds.add(browser))
  })

  const sortedDates = Object.keys(stats.value.timeSeriesDistribution ?? {}).sort()

  const browserIds = Array.from(allBrowserIds)

  const data = sortedDates.map((isoDate) => {
    const entry = stats.value?.timeSeriesDistribution?.[isoDate] ?? {}
    const timestamp = new Date(isoDate).getTime()

    return browserIds.reduce<TimeSeriesDatum>(
      (acc, browser) => {
        acc[browser] = entry[browser] ?? 0
        return acc
      },
      { date: timestamp },
    )
  })

  const categories = browserIds.reduce<Record<string, { name: string; color: string }>>(
    (acc, browserId) => {
      acc[browserId] = { name: formatBrowserName(browserId), color: getBrowserColor(browserId) }
      return acc
    },
    {},
  )

  return { data, categories, yAxisKeys: browserIds }
})

const timeSeriesWindow = computed(() => {
  if (!stats.value) return null
  const dates = Object.keys(stats.value.timeSeriesDistribution ?? {}).sort()
  if (!dates.length) return null
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  const start = formatter.format(new Date(dates[0]))
  const end = formatter.format(new Date(dates[dates.length - 1]))
  if (start === end) return start
  return `${start} — ${end}`
})

const machineBreakdown = computed<MachineBreakdownItem[]>(() => {
  if (!stats.value) return []

  const total = totalEntries.value || 1
  const distribution = stats.value.machineBrowserDistribution ?? {}

  return Object.entries(distribution)
    .map(([machineId, browsers]) => {
      const machineSessions =
        stats.value?.machineDistribution?.[machineId] ??
        Object.values(browsers).reduce((acc, value) => acc + value, 0)
      const browserList = Object.entries(browsers)
        .sort((a, b) => b[1] - a[1])
        .map(([browserId, count], index) => ({
          id: browserId,
          name: formatBrowserName(browserId),
          count,
          share: formatPercent(count / (machineSessions || 1)),
          color: getBrowserColor(browserId),
        }))
      return {
        id: machineId,
        sessions: machineSessions,
        share: formatPercent(machineSessions / total),
        browsers: browserList,
      }
    })
    .sort((a, b) => b.sessions - a.sessions)
})

const formatCountLabel = (value: number) => `${numberFormatter.format(value)}`
const formatMachineLabel = (value: string | number) => String(value)

const formatTimeSeriesTick = (value: number | Date) => {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(value)
  }

  if (Number.isFinite(value)) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value))
  }

  return String(value)
}

const formatPercent = (value: number) => {
  if (!Number.isFinite(value)) return '0%'
  return `${Math.round(value * 1000) / 10}%`
}

onMounted(fetchStats)

watch(selectedRange, () => {
  fetchStats()
})
</script>
