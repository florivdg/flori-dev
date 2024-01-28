<template>
  <div class="absolute bottom-0 right-0 top-0 z-10 w-96 p-4">
    <div
      class="h-full overflow-hidden rounded-xl bg-slate-100/80 shadow-xl backdrop-blur-lg dark:bg-slate-800/80"
    >
      <div class="h-full overflow-y-auto px-6 py-20">
        <h1 class="mb-6 text-balance text-4xl font-black">
          {{ entry.data.title }}
        </h1>

        <p class="text-xl">{{ entry.data.alt }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CollectionEntry } from 'astro:content'

/*
 * Props.
 */
defineProps<{
  entry: CollectionEntry<'grid'>
}>()
</script>
