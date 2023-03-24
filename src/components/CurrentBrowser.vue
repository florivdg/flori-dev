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
        v-if="browser"
        class="my-4 flex aspect-square w-2/3 items-center self-center rounded-2xl bg-white @xl:my-8 @xl:w-60 @4xl:self-auto dark:bg-slate-800"
      >
        <img
          :src="`/icons/${browser}.svg`"
          :alt="browser"
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
import { useWebSocket } from '@vueuse/core'

/**
 * Reactive websocket for live updates.
 */
const { status, data: browser } = useWebSocket<string>(
  import.meta.env.PUBLIC_DEFAULT_BROWSER_WEB_SOCKET_URL,
  {
    autoReconnect: true,
  },
)
</script>
