<template>
  <div class="absolute bottom-0 left-0 right-0 z-10 flex justify-center p-6">
    <nav>
      <ul class="flex gap-2">
        <li>
          <a
            :href="prevLink"
            title="Go to previous photo"
            class="image-grid-button"
            :class="[prevLink ? '' : 'pointer-events-none opacity-50']"
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
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>

            <span class="sr-only">Go to previous photo</span>
          </a>
        </li>
        <li>
          <a
            :href="nextLink"
            title="Go to next photo"
            class="image-grid-button"
            :class="[nextLink ? '' : 'pointer-events-none opacity-50']"
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
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>

            <span class="sr-only">Go to next photo</span>
          </a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMagicKeys } from '@vueuse/core'
import type { CollectionEntry } from 'astro:content'

/**
 * Props.
 */
const props = defineProps<{
  prev?: CollectionEntry<'grid'>
  next?: CollectionEntry<'grid'>
}>()

/**
 * The link to the previous photo.
 */
const prevLink = computed(() =>
  props.prev ? `/grid/${props.prev.id}/` : undefined,
)

/**
 * The link to the next photo.
 */
const nextLink = computed(() =>
  props.next ? `/grid/${props.next.id}/` : undefined,
)

/**
 * Whether navigation is underway.
 */
const navigationIsUnderway = ref(false)

/**
 * Use keyboard navigation.
 */
const { ArrowLeft, ArrowRight } = useMagicKeys()
watch([ArrowLeft, ArrowRight], ([pressedLeft, pressedRight]) => {
  if (navigationIsUnderway.value) return

  if (pressedLeft && prevLink.value) {
    navigationIsUnderway.value = true
    window.location.href = prevLink.value
  }

  if (pressedRight && nextLink.value) {
    navigationIsUnderway.value = true
    window.location.href = nextLink.value
  }
})
</script>
