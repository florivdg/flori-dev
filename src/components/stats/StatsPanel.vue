<template>
  <article
    class="rounded-2xl bg-slate-50 p-6 shadow-xl shadow-slate-700/10 transition-shadow duration-200 dark:bg-slate-900/70 dark:shadow-slate-950/20"
  >
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {{ title }}
        </p>
        <p class="text-lg font-bold text-slate-900 dark:text-white">
          {{ subtitle }}
        </p>
      </div>
      <span
        v-if="badge"
        class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold whitespace-nowrap text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      >
        {{ badge }}
      </span>
      <slot name="badge" />
    </div>

    <div class="mt-4">
      <slot />
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  badge?: string | number | null
}>()
</script>
