<template>
  <div
    class="fixed inset-0 z-[500] flex h-dvh w-full items-center justify-center bg-white dark:bg-gray-950"
  >
    <img
      :src="entry.data.image.src"
      :alt="entry.data.alt"
      class="mx-auto h-auto max-h-full w-auto max-w-full"
    />

    <div class="absolute left-0 top-0 z-20 p-6">
      <a
        href="/grid/"
        title="Go back to the photo grid"
        class="flex h-10 w-10 -rotate-[0.1deg] -skew-x-[0.5deg] items-center justify-center rounded-lg bg-slate-300/50 text-center backdrop-blur transition-all duration-150 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2 hover:motion-safe:-rotate-2 dark:bg-slate-700/80 dark:focus-visible:ring-slate-500 dark:focus-visible:ring-offset-slate-950"
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.25"
          stroke="currentColor"
          class="h-6 w-6 text-slate-700 dark:text-slate-300"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
          />
        </svg>
        <span class="sr-only">Go back to the photo grid</span>
      </a>
    </div>

    <div class="absolute bottom-0 right-0 z-20 p-6">
      <button
        type="button"
        @click="showInfo = !showInfo"
        title="Show info about the photograph"
        class="flex h-10 w-10 -rotate-1 -skew-x-[0.5deg] items-center justify-center rounded-lg text-center backdrop-blur transition-all duration-150 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2 hover:motion-safe:rotate-2 dark:focus-visible:ring-slate-500 dark:focus-visible:ring-offset-slate-950"
        :class="{
          'bg-slate-200/80 text-slate-700 dark:bg-slate-700/80 dark:text-slate-300':
            !showInfo,
          'bg-slate-800/80 text-slate-100 dark:bg-slate-200/80 dark:text-slate-700':
            showInfo,
        }"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.25"
          stroke="currentColor"
          class="h-6 w-6 text-inherit"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
          />
        </svg>
      </button>
    </div>

    <PhotographInfo v-model="showInfo" :entry="entry" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMagicKeys, useLocalStorage } from '@vueuse/core'
import PhotographInfo from './PhotographInfo.vue'
import type { CollectionEntry } from 'astro:content'

/*
 * Props.
 */
defineProps<{
  entry: CollectionEntry<'grid'>
}>()

/**
 * Show info about the photograph.
 */
const showInfo = useLocalStorage('show-photograph-info', false, {
  initOnMounted: true,
})

/**
 * Toggle info on keypress.
 */
const { i } = useMagicKeys()
watch(i, (i) => {
  if (i) showInfo.value = !showInfo.value
})
</script>
