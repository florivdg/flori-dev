<template>
  <div class="@container">
    <div
      class="relative flex -rotate-1 -skew-x-3 flex-col rounded-lg border border-slate-300 bg-gray-100 p-4 shadow-xl @4xl:flex-row @4xl:items-center @4xl:justify-center @4xl:gap-4 dark:border-slate-700 dark:bg-slate-900"
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
          v-if="isBrowserValid(browser)"
          :src="`/icons/${browser}.svg`"
          :alt="validBrowserBundleIds[browser as keyof typeof validBrowserBundleIds]"
          class="aspect-square w-full object-contain p-5 @4xl:p-10"
          loading="lazy"
          width="100"
          height="100"
        />

        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="100"
          height="100"
          viewBox="0 0 320 512"
          class="mx-auto block self-center fill-current text-slate-500 dark:text-slate-400"
        >
          <!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
          <path
            d="M80 160c0-35.3 28.7-64 64-64h32c35.3 0 64 28.7 64 64v3.6c0 21.8-11.1 42.1-29.4 53.8l-42.2 27.1c-25.2 16.2-40.4 44.1-40.4 74V320c0 17.7 14.3 32 32 32s32-14.3 32-32v-1.4c0-8.2 4.2-15.8 11-20.2l42.2-27.1c36.6-23.6 58.8-64.1 58.8-107.7V160c0-70.7-57.3-128-128-128H144C73.3 32 16 89.3 16 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm80 320a40 40 0 1 0 0-80 40 40 0 1 0 0 80z"
          />
        </svg>
      </div>
      <p
        class="fix-bg-clip-text-safari self-center bg-gradient-to-tl from-pink-500 to-sky-500 bg-clip-text !p-2.5 text-center text-6xl font-black text-transparent @xl:self-end @4xl:self-auto @4xl:text-5xl @5xl:text-7xl"
      >
        right now.
      </p>

      <div
        class="relative bottom-0 right-0 mt-4 flex justify-end @4xl:absolute @4xl:mt-0 @4xl:px-3.5 @4xl:py-2.5"
      >
        <button
          class="flex items-center gap-1 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 dark:focus-visible:ring-slate-600"
          :class="[status === 'CLOSED' ? 'cursor-pointer' : 'cursor-default']"
          @click="handleReconnect"
        >
          <span
            class="inline-block h-2.5 w-2.5 animate-pulse rounded-full"
            :class="[status === 'OPEN' ? 'bg-lime-500' : 'bg-red-500']"
          ></span>
          <span
            class="font-mono text-xs font-bold uppercase text-slate-600 dark:text-slate-400"
            >{{ status === 'OPEN' ? 'Connected' : 'Reconnect?' }}</span
          >
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWebSocket } from '@vueuse/core'

/**
 * Reactive websocket for live updates.
 */
const {
  status,
  data: browser,
  open,
} = useWebSocket<string>('wss://browser.flori.dev/live', {
  autoReconnect: {
    retries: 10,
    delay: 2500,
    onFailed() {
      console.error('Failed to connect to the default browser WebSocket.')
    },
  },
})

/**
 * Reconnect manually to the websocket when the a button is clicked.
 */
const handleReconnect = () => {
  if (status.value === 'CLOSED') open()
}

/**
 * List of valid browser bundle ids for that exist icons.
 */
const validBrowserBundleIds = {
  'com.apple.Safari': 'Safari',
  'com.apple.SafariTechnologyPreview': 'Safari Technology Preview',
  'com.brave.Browser': 'Brave',
  'com.google.Chrome.canary': 'Chrome Canary',
  'com.google.Chrome': 'Chrome',
  'com.microsoft.edgemac': 'Edge',
  'org.mozilla.firefox': 'Firefox',
}

/**
 * Check if the received browser data is valid.
 */
const isBrowserValid = (browser: string) => {
  return Object.keys(validBrowserBundleIds).includes(browser)
}
</script>
