<template>
  <div class="absolute bottom-0 right-0 top-0 z-30 max-w-96 p-4">
    <Transition
      enter-from-class="translate-x-[105%] scale-95"
      enter-active-class="transform transition ease-in-out duration-500 sm:duration-700"
      enter-to-class="translate-x-0 scale-100"
      leave-from-class="translate-x-0 scale-100"
      leave-active-class="transform transition ease-in-out duration-500 sm:duration-700"
      leave-to-class="translate-x-[105%] scale-95"
    >
      <div
        v-show="showInfo"
        class="h-full overflow-hidden rounded-xl bg-slate-100/80 shadow-xl backdrop-blur-lg dark:bg-slate-800/80"
      >
        <div class="h-full overflow-y-auto px-6 pb-20 pt-6">
          <h1
            class="mb-4 inline-block text-balance bg-gradient-to-tr from-pink-500 to-sky-500 bg-clip-text text-3xl font-black text-transparent dark:from-pink-400 dark:to-sky-400"
          >
            {{ entry.data.title }}
          </h1>

          <p
            v-if="entry.data.location"
            class="-mt-2 mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            {{ entry.data.location }}
          </p>

          <table
            class="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            <tbody>
              <tr>
                <td class="w-10">
                  <svg
                    id="icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    aria-hidden="true"
                    class="h-6 w-6 fill-current text-slate-500"
                  >
                    <path
                      d="M29,26H3a1,1,0,0,1-1-1V8A1,1,0,0,1,3,7H9.46l1.71-2.55A1,1,0,0,1,12,4h8a1,1,0,0,1,.83.45L22.54,7H29a1,1,0,0,1,1,1V25A1,1,0,0,1,29,26ZM4,24H28V9H22a1,1,0,0,1-.83-.45L19.46,6H12.54L10.83,8.55A1,1,0,0,1,10,9H4Z"
                    />
                    <path
                      d="M16,22a6,6,0,1,1,6-6A6,6,0,0,1,16,22Zm0-10a4,4,0,1,0,4,4A4,4,0,0,0,16,12Z"
                    />
                  </svg>
                  <span class="sr-only">Camera</span>
                </td>
                <td>
                  {{ cameraName }}
                </td>
              </tr>
              <tr>
                <td>
                  <svg
                    id="icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    aria-hidden="true"
                    class="h-6 w-6 fill-current text-slate-500"
                  >
                    <path
                      d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,26A12,12,0,1,1,28,16,12,12,0,0,1,16,28Z"
                    />
                  </svg>
                  <span class="sr-only">Lens</span>
                </td>
                <td>
                  {{ entry.data.exif.lens }}
                </td>
              </tr>
              <tr>
                <td>
                  <svg
                    id="icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    aria-hidden="true"
                    class="h-6 w-6 fill-current text-slate-500"
                  >
                    <path
                      d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2ZM27.84,14.14,22,17.52V5.62A12,12,0,0,1,27.84,14.14ZM12,18.68V13.32L16,11l4,2.31v5.36L16,21Zm8-14V11L10.34,5.42A11.9,11.9,0,0,1,20,4.7Zm-11.52,2L14,9.85,4,15.62A12,12,0,0,1,8.48,6.66ZM4.16,17.85,10,14.47V26.38A12,12,0,0,1,4.16,17.85ZM12,27.3V21l9.67,5.58A11.92,11.92,0,0,1,16,28,12.05,12.05,0,0,1,12,27.3Zm11.52-2L18,22.14l10-5.77A12,12,0,0,1,23.52,25.34Z"
                    />
                  </svg>
                  <span class="sr-only">Aperture</span>
                </td>
                <td>f/{{ entry.data.exif.aperture }}</td>
              </tr>
              <tr>
                <td>
                  <svg
                    id="icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    aria-hidden="true"
                    class="h-6 w-6 fill-current text-slate-500"
                  >
                    <path
                      d="M9,24a3.51,3.51,0,0,0-.88-1.86L17.65,5.56l-1.73-1L6.35,21.12A3.06,3.06,0,0,0,5.5,21a3.5,3.5,0,1,0,3.15,5H28V24ZM5.5,26A1.5,1.5,0,1,1,7,24.5,1.5,1.5,0,0,1,5.5,26Z"
                      transform="translate(0 0)"
                    />
                    <path
                      d="M22,21h2a13,13,0,0,0-5.42-10.56l-1.16,1.62A11,11,0,0,1,22,21Z"
                      transform="translate(0 0)"
                    />
                  </svg>
                </td>
                <td>{{ parseInt(entry.data.exif.focal_length) }} mm</td>
              </tr>
              <tr>
                <td>
                  <svg
                    id="icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    aria-hidden="true"
                    class="h-6 w-6 fill-current text-slate-500"
                  >
                    <path
                      d="M16,28A11,11,0,1,1,27,17,11,11,0,0,1,16,28ZM16,8a9,9,0,1,0,9,9A9,9,0,0,0,16,8Z"
                    />
                    <polygon
                      points="18.59 21 15 17.41 15 11 17 11 17 16.58 20 19.59 18.59 21"
                    />
                    <rect
                      class="cls-1"
                      x="3.96"
                      y="5.5"
                      width="5.07"
                      height="2"
                      transform="translate(-2.69 6.51) rotate(-45.06)"
                    />
                    <rect
                      class="cls-1"
                      x="24.5"
                      y="3.96"
                      width="2"
                      height="5.07"
                      transform="translate(2.86 19.91) rotate(-44.94)"
                    />
                  </svg>
                  <span class="sr-only">Shutter Speed</span>
                </td>
                <td>{{ entry.data.exif.shutter_speed }} s</td>
              </tr>
              <tr>
                <td>
                  <svg
                    id="icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    aria-hidden="true"
                    class="h-6 w-6 fill-current text-slate-500"
                  >
                    <path
                      d="M24,21H21a2,2,0,0,1-2-2V13a2,2,0,0,1,2-2h3a2,2,0,0,1,2,2v6A2,2,0,0,1,24,21Zm-3-8v6h3V13Z"
                    />
                    <path
                      d="M15,21H10V19h5V17H12a2,2,0,0,1-2-2V13a2,2,0,0,1,2-2h5v2H12v2h3a2,2,0,0,1,2,2v2A2,2,0,0,1,15,21Z"
                    />
                    <rect x="6" y="11" width="2" height="10" />
                    <path
                      d="M28,6H4A2,2,0,0,0,2,8V24a2,2,0,0,0,2,2H28a2,2,0,0,0,2-2V8A2,2,0,0,0,28,6ZM4,24V8H28V24Z"
                    />
                  </svg>
                  <span class="sr-only">ISO</span>
                </td>
                <td>
                  {{ entry.data.exif.iso }}
                </td>
              </tr>
            </tbody>
          </table>

          <p
            class="mb-6 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {{ entry.data.alt }}
          </p>

          <ul class="flex-cols flex flex-wrap gap-2">
            <li
              v-for="tag in entry.data.tags"
              class="inline-block -rotate-1 -skew-x-3 rounded-full bg-gradient-to-tr from-pink-500 to-blue-500 px-2.5 py-1 font-mono text-xs font-semibold text-white"
            >
              #{{ tag.toLowerCase().replaceAll(' ', '') }}
            </li>
          </ul>
        </div>
      </div>
    </Transition>

    <GridImageInfoButton v-model="showInfo" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useMagicKeys, useLocalStorage } from '@vueuse/core'
import type { CollectionEntry } from 'astro:content'

import GridImageInfoButton from './GridImageInfoButton.vue'

/*
 * Props.
 */
const props = defineProps<{
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

/*
 * Computed.
 */
const cameraName = computed(() => {
  const camera = props.entry.data.exif.camera
  switch (camera) {
    case 'Canon EOS R6m2':
      return 'Canon EOS R6 Mark II'

    default:
      return camera
  }
})
</script>
