<template>
  <div class="absolute right-0 bottom-0 left-0 z-10 flex justify-center p-6">
    <nav>
      <ul class="flex gap-2">
        <li v-for="button in buttons" :key="button.label">
          <a
            :href="button.href ?? '#'"
            :aria-disabled="button.href ? undefined : 'true'"
            :tabindex="button.href ? undefined : -1"
            :aria-label="button.label"
            class="image-grid-button"
            :class="{ 'pointer-events-none opacity-50': !button.href }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.25"
              stroke="currentColor"
              class="h-6 w-6 text-slate-700 dark:text-slate-300"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                :d="button.path"
              />
            </svg>
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

const props = defineProps<{
  prev?: CollectionEntry<'grid'>
  next?: CollectionEntry<'grid'>
}>()

const prevLink = computed(() =>
  props.prev ? `/grid/${props.prev.id}/` : undefined,
)

const nextLink = computed(() =>
  props.next ? `/grid/${props.next.id}/` : undefined,
)

const buttons = computed(() => [
  {
    href: prevLink.value,
    label: 'Go to previous photo',
    path: 'M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18',
  },
  {
    href: nextLink.value,
    label: 'Go to next photo',
    path: 'M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3',
  },
])

const navigationIsUnderway = ref(false)

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
