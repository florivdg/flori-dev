<template>
  <section class="browser-stats flex flex-col gap-8">
    <header
      class="flex flex-col gap-4 rounded-2xl bg-slate-50/90 p-6 shadow-xl shadow-slate-700/10 transition-shadow duration-200 sm:flex-row sm:items-end sm:justify-between dark:bg-slate-900/60 dark:shadow-slate-950/30"
    >
      <div>
        <p
          class="text-xs font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400"
        >
          Default browser tracker
        </p>
        <h2 class="mt-2 text-3xl font-black text-slate-900 dark:text-white">
          Live defaults from my Macs
        </h2>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
          These counts come from the LaunchAgent + SSE backend I describe in my
          <a href="/reads/default-browser-server-sent-events" class="link"
            >Reads article</a
          >
          and reflect which browser is currently the default on my Macs for the
          selected window.
        </p>
      </div>

      <label
        class="flex flex-col gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
      >
        Time span
        <select
          v-model="selectedRange"
          class="timeframe-select w-full appearance-none rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 pr-14 text-base font-semibold text-slate-900 shadow-inner shadow-white/40 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 focus:outline-none sm:min-w-[220px] dark:border-slate-600/50 dark:bg-slate-900/70 dark:text-white dark:shadow-none dark:focus:border-sky-500/70 dark:focus:ring-sky-500/30"
        >
          <option
            v-for="option in timeframeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
    </header>

    <div
      v-if="errorMessage"
      class="rounded-2xl bg-rose-50/80 p-6 text-rose-800 shadow-xl shadow-rose-200/40 dark:bg-rose-950/40 dark:text-rose-100 dark:shadow-rose-950/30"
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
        class="rounded-2xl bg-slate-50/90 p-8 text-center text-slate-500 shadow-xl shadow-slate-700/10 dark:bg-slate-900/60 dark:text-slate-300 dark:shadow-slate-950/20"
      >
        Loading usage details…
      </div>

      <div v-else-if="stats" class="flex flex-col gap-8">
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="card in summaryCards"
            :key="card.label"
            class="rounded-2xl bg-slate-50 p-5 shadow-xl shadow-slate-700/10 transition-shadow duration-200 dark:bg-slate-900/70 dark:shadow-slate-950/20"
          >
            <p
              class="text-xs font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400"
            >
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
          <article
            class="rounded-2xl bg-slate-50 p-6 shadow-xl shadow-slate-700/10 transition-shadow duration-200 dark:bg-slate-900/70 dark:shadow-slate-950/20"
          >
            <div class="flex items-center justify-between gap-4">
              <div>
                <p
                  class="text-sm font-semibold text-slate-500 dark:text-slate-400"
                >
                  Default browser distribution
                </p>
                <p class="text-lg font-bold text-slate-900 dark:text-white">
                  Who holds the default slot most often
                </p>
              </div>
              <span
                class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                {{ totalEntries }} updates
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
                class="rounded-xl bg-slate-100/80 px-4 py-10 text-center text-sm text-slate-500 shadow-inner shadow-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:shadow-slate-950/30"
              >
                No browser breakdown available for this time span.
              </p>
            </div>
          </article>

          <article
            class="rounded-2xl bg-slate-50 p-6 shadow-xl shadow-slate-700/10 transition-shadow duration-200 dark:bg-slate-900/70 dark:shadow-slate-950/20"
          >
            <div class="flex items-center justify-between gap-4">
              <div>
                <p
                  class="text-sm font-semibold text-slate-500 dark:text-slate-400"
                >
                  Macs reporting
                </p>
                <p class="text-lg font-bold text-slate-900 dark:text-white">
                  Which Mac broadcast those defaults
                </p>
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
                class="rounded-xl bg-slate-100/80 px-4 py-10 text-center text-sm text-slate-500 shadow-inner shadow-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:shadow-slate-950/30"
              >
                No machine level details for this range.
              </p>
            </div>
          </article>
        </section>

        <section
          class="rounded-2xl bg-slate-50 p-6 shadow-xl shadow-slate-700/10 transition-shadow duration-200 dark:bg-slate-900/70 dark:shadow-slate-950/20"
        >
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p
                class="text-sm font-semibold text-slate-500 dark:text-slate-400"
              >
                Time series
              </p>
              <p class="text-lg font-bold text-slate-900 dark:text-white">
                Every default update across the selected window
              </p>
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
              v-if="
                timeSeriesChart.data.length &&
                Object.keys(timeSeriesChart.categories).length
              "
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
              class="rounded-xl bg-slate-100/80 px-4 py-10 text-center text-sm text-slate-500 shadow-inner shadow-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:shadow-slate-950/30"
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
            class="rounded-2xl bg-slate-50 p-5 shadow-xl shadow-slate-700/10 transition-shadow duration-200 dark:bg-slate-900/70 dark:shadow-slate-950/20"
          >
            <div class="flex items-baseline justify-between gap-4">
              <div>
                <p
                  class="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
                >
                  {{ formatMachineLabel(machine.id) }}
                </p>
                <p class="text-xl font-bold text-slate-900 dark:text-white">
                  {{ machine.sessions }} updates
                </p>
              </div>
              <p
                class="text-sm font-semibold text-slate-600 dark:text-slate-300"
              >
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
                <span
                  class="font-mono text-xs text-slate-500 dark:text-slate-400"
                >
                  {{ browser.count }} ({{ browser.share }})
                </span>
              </li>
            </ul>
          </article>
        </section>
      </div>

      <div
        v-else
        class="rounded-2xl bg-slate-50/90 p-8 text-center text-slate-500 shadow-xl shadow-slate-700/10 dark:bg-slate-900/60 dark:text-slate-300 dark:shadow-slate-950/20"
      >
        No stats were returned for this time selection.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BarChart, DonutChart, LegendPosition, Orientation } from 'vue-chrts'
import { getBrowserLabel } from '../utils/browserMap'

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
  value: number | 'all'
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
  dateLabel: string
  [browserId: string]: number | string
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

const MACHINE_LABELS: Record<string, string> = {
  'Mac13,1': 'Mac Studio M1 Max',
  'Mac14,15': 'MacBook Air M2',
}

const formatMachineLabel = (value: string | number) => {
  const machineId = String(value)
  return MACHINE_LABELS[machineId] ?? machineId
}

const timeframeOptions: TimeframeOption[] = [
  { label: 'Last 24 hours', value: 1 },
  { label: 'Last week', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
  { label: 'Last year', value: 365 },
  { label: 'All time', value: 'all' },
]

const selectedRange = ref<TimeframeOption['value']>(90)
const stats = ref<BrowserStatsResponse | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const abortController = ref<AbortController | null>(null)

const numberFormatter = new Intl.NumberFormat('en-US')
const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

const knownBrowserColors: Record<string, string> = {
  'com.apple.Safari': '#0ea5e9',
  'com.apple.SafariTechnologyPreview': '#38bdf8',
  'com.google.Chrome': '#facc15',
  'org.mozilla.firefox': '#f97316',
  'company.thebrowser.dia': '#c026d3',
  'company.thebrowser.Browser': '#c026d3',
  'com.microsoft.edgemac': '#2563eb',
  'app.zen-browser.zen': '#8b5cf6',
  'com.google.Chrome.canary': '#fb7185',
  'com.brave.Browser': '#ea580c',
  'net.imput.helium': '#22d3ee',
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
    dynamicBrowserColors.set(
      id,
      fallbackColors[fallbackIndex % fallbackColors.length],
    )
    fallbackIndex += 1
  }

  return dynamicBrowserColors.get(id) as string
}

const formatBrowserName = (bundleId: string) => {
  const label = getBrowserLabel(bundleId)
  if (label) return label
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
    const response = await fetch(
      `${STATS_ENDPOINT}?days=${selectedRange.value}`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      },
    )

    if (!response.ok)
      throw new Error(`Request failed with status ${response.status}`)

    const payload = (await response.json()) as BrowserStatsResponse
    stats.value = payload
  } catch (error) {
    if ((error as DOMException).name === 'AbortError') return
    errorMessage.value =
      (error as Error)?.message ??
      'Something went wrong while loading the stats.'
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
      label: 'Total default updates',
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
      helper: topBrowserId ? 'Most frequent default selection' : undefined,
    },
    {
      label: 'Macs reporting',
      value: numberFormatter.format(
        Object.keys(stats.value.machineDistribution ?? {}).length,
      ),
    },
  ]
})

const browserDonut = computed<DonutDataset>(() => {
  if (!stats.value) return { data: [], categories: {} }

  const entries = Object.entries(stats.value.browserDistribution).sort(
    (a, b) => b[1] - a[1],
  )
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
      categories: {
        sessions: { name: 'Default updates', color: '#6366f1' },
      },
    }
  }

  const entries = Object.entries(stats.value.machineDistribution ?? {})
    .map(([machine, sessions]) => ({
      machine: formatMachineLabel(machine),
      sessions,
    }))
    .sort((a, b) => b.sessions - a.sessions)

  return {
    data: entries,
    height: Math.max(220, entries.length * 48),
    categories: {
      sessions: {
        name: 'Default updates',
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
  Object.values(stats.value.timeSeriesDistribution ?? {}).forEach(
    (distribution) => {
      Object.keys(distribution).forEach((browser) => allBrowserIds.add(browser))
    },
  )

  const sortedDates = Object.keys(
    stats.value.timeSeriesDistribution ?? {},
  ).sort()

  const browserIds = Array.from(allBrowserIds)

  const data = sortedDates.map((isoDate) => {
    const entry = stats.value?.timeSeriesDistribution?.[isoDate] ?? {}
    const parsedDate = new Date(isoDate)
    const timestamp = parsedDate.getTime()
    const formattedDate = shortDateFormatter.format(parsedDate)

    return browserIds.reduce<TimeSeriesDatum>(
      (acc, browser) => {
        acc[browser] = entry[browser] ?? 0
        return acc
      },
      { dateLabel: formattedDate, date: timestamp },
    )
  })

  const categories = browserIds.reduce<
    Record<string, { name: string; color: string }>
  >((acc, browserId) => {
    acc[browserId] = {
      name: formatBrowserName(browserId),
      color: getBrowserColor(browserId),
    }
    return acc
  }, {})

  return { data, categories, yAxisKeys: browserIds }
})

const timeSeriesWindow = computed(() => {
  if (!stats.value) return null
  const dates = Object.keys(stats.value.timeSeriesDistribution ?? {}).sort()
  if (!dates.length) return null
  const start = shortDateFormatter.format(new Date(dates[0]))
  const end = shortDateFormatter.format(new Date(dates[dates.length - 1]))
  if (start === end) return start
  return `${start} — ${end}`
})

const timeSeriesTickLabels = computed(() =>
  timeSeriesChart.value.data.map((datum) => ({
    label: datum.dateLabel,
    timestamp: datum.date,
  })),
)

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

const formatTimeSeriesTick = (value: number | Date) => {
  if (value instanceof Date) {
    return shortDateFormatter.format(value)
  }

  if (Number.isFinite(value)) {
    const ticks = timeSeriesTickLabels.value
    const index = Math.round(Number(value))
    const clampedIndex = Math.min(Math.max(index, 0), ticks.length - 1)
    const tick = ticks[clampedIndex]
    if (tick?.label) return tick.label
    if (Number.isFinite(tick?.timestamp)) {
      return shortDateFormatter.format(new Date(Number(tick?.timestamp)))
    }

    return shortDateFormatter.format(new Date(Number(value)))
  }

  return String(value)
}

const formatPercent = (value: number) => {
  if (!Number.isFinite(value)) return '0%'
  return `${Math.round(value * 1000) / 10}%`
}

const refreshStatsOnReturn = () => {
  if (document.visibilityState !== 'visible') return
  if (isLoading.value) return
  fetchStats()
}

onMounted(() => {
  fetchStats()
  window.addEventListener('focus', refreshStatsOnReturn)
  document.addEventListener('visibilitychange', refreshStatsOnReturn)
})

onBeforeUnmount(() => {
  window.removeEventListener('focus', refreshStatsOnReturn)
  document.removeEventListener('visibilitychange', refreshStatsOnReturn)
})

watch(selectedRange, () => {
  fetchStats()
})
</script>

<style scoped>
.browser-stats {
  --legend-row-gap: 0.35rem;
  --legend-column-gap: 1rem;
}

.browser-stats :global(.unovis-single-container),
.browser-stats :global(.unovis-xy-container) {
  width: 100%;
  max-width: 100%;
}

.browser-stats :global(.unovis-single-container svg),
.browser-stats :global(.unovis-xy-container svg) {
  max-width: 100%;
}

.browser-stats :global([data-vis-bullet-legend]) {
  flex-wrap: wrap;
  justify-content: center;
  column-gap: var(--legend-column-gap);
  row-gap: var(--legend-row-gap);
}

.browser-stats :global([data-vis-bullet-legend] > *) {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex: 1 1 140px;
  min-width: 120px;
}

.timeframe-select {
  --select-chevron: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none' stroke='%2363748b' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3.5 5l3.5 4 3.5-4'/%3E%3C/svg%3E");
  background-image: var(--select-chevron);
  background-repeat: no-repeat;
  background-position: right 1.35rem center;
  background-size: 0.75rem;
  padding-right: 3.5rem;
  appearance: none;
}

.timeframe-select::-ms-expand {
  display: none;
}

:global(.dark) .timeframe-select {
  --select-chevron: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none' stroke='%23f8fafc' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3.5 5l3.5 4 3.5-4'/%3E%3C/svg%3E");
}

@media (min-width: 768px) {
  .browser-stats :global([data-vis-bullet-legend]) {
    justify-content: flex-start;
  }
}
</style>
