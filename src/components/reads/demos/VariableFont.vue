<template>
  <div class="rounded-lg bg-slate-100 text-center dark:bg-slate-900">
    <span style="font-family: 'Mona Sans', sans-serif; font-size: 6rem"
      >Demo</span
    >
  </div>

  <div>
    <p class="mb-0 font-semibold">Font Weight</p>

    <div class="flex items-center gap-4">
      <input type="range" min="200" max="900" v-model="width" class="w-full" />
      <span>{{ width }}</span>
    </div>

    <p class="mb-0 font-semibold">Font Stretch</p>

    <div class="flex items-center gap-4">
      <input type="range" min="75" max="125" v-model="stretch" class="w-full" />
      <span class="shrink-0 text-nowrap">{{ stretch }} %</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const width = ref(888)
const stretch = ref(100)

const computedStretch = computed(() => `${stretch.value}%`)
</script>

<style scoped>
span {
  font-weight: v-bind('width');
  font-stretch: v-bind('computedStretch');
}
</style>
