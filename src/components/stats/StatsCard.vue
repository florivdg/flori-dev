<template>
  <article
    class="rounded-2xl bg-slate-50 p-5 shadow-xl shadow-slate-700/10 transition-shadow duration-200 dark:bg-slate-900/70 dark:shadow-slate-950/20"
  >
    <p
      class="text-xs font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400"
    >
      {{ label }}
    </p>
    <p class="mt-3 text-3xl font-black text-slate-900 dark:text-white">
      {{ value }}
    </p>
    <p v-if="helper" class="mt-1 text-sm text-slate-600 dark:text-slate-400">
      {{ helper }}
    </p>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  helper?: string
}>()
</script>
