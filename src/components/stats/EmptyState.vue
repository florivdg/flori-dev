<template>
  <p
    class="rounded-xl bg-slate-100/80 px-4 py-10 text-center text-sm text-slate-500 shadow-inner shadow-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:shadow-slate-950/30"
  >
    {{ message }}
  </p>
</template>

<script setup lang="ts">
defineProps<{
  message: string
}>()
</script>
