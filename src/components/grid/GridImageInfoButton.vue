<template>
  <div class="absolute bottom-0 right-0 z-50 p-6">
    <button
      type="button"
      @click="showInfo = !showInfo"
      title="Show info about the photograph"
      class="image-grid-button"
      :class="{
        active: showInfo,
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
</template>

<script setup lang="ts">
const showInfo = defineModel<boolean>()
</script>
