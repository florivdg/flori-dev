<template>
  <div class="absolute left-0 top-0 z-20 p-6">
    <a
      href="/grid/"
      title="Go back to the photo grid"
      class="flex h-10 w-10 -rotate-[0.1deg] -skew-x-[0.5deg] items-center justify-center rounded-lg bg-slate-300/50 text-center backdrop-blur transition-all duration-150 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2 hover:motion-safe:-rotate-2 dark:bg-slate-700/80 dark:focus-visible:ring-slate-500 dark:focus-visible:ring-offset-slate-950"
      @click="handleBackNavigation($event)"
    >
      <svg
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
          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
        />
      </svg>

      <span class="sr-only">Go back to the photo grid</span>
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSessionStorage, watchOnce } from '@vueuse/core'

/**
 * Whether to go back to grid via history.
 */
const backToGrid = ref(false)

/**
 * Check origin for altering the back navigation.
 */
const fromGrid = useSessionStorage<boolean>('from-grid', false, {
  initOnMounted: true,
})

/**
 * Go back to grid if requested.
 */
watchOnce(fromGrid, (grid) => {
  if (grid) backToGrid.value = true
  fromGrid.value = false
})

/**
 * Handle a click on the back to grid button.
 * @param e The MouseEvent object.
 */
const handleBackNavigation = (e: MouseEvent) => {
  if (backToGrid.value) {
    e.preventDefault()
    window.history.back()
  }
}
</script>
