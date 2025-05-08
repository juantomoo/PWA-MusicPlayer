<template>
  <div class="flex gap-2 items-center justify-center w-full">
    <button @click="$emit('prev')" class="px-3 py-1 bg-vaporwave2 text-white rounded">⏮</button>
    <button @click="$emit('togglePlay')" class="px-3 py-1 bg-vaporwave1 text-white rounded">
      <slot name="play-icon">▶</slot>
    </button>
    <button @click="$emit('next')" class="px-3 py-1 bg-vaporwave2 text-white rounded">⏭</button>
  </div>
</template>
<script setup>
// Props: isPlaying (bool)
</script>