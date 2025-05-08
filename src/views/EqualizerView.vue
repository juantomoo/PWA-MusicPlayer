<template>
  <div class="flex flex-col items-center gap-4 p-4">
    <div class="font-bold text-vaporwave3 mb-1">Ecualizador</div>
    <div class="flex gap-2">
      <div v-for="b in 5" :key="b" class="flex flex-col items-center">
        <input type="range" min="-12" max="12" value="0" class="accent-vaporwave2" disabled />
        <span class="text-xs text-vaporwave4">{{ ['60Hz','230Hz','910Hz','3.6k','14k'][b-1] }}</span>
      </div>
    </div>
    <div class="text-xs text-vaporwave4 mt-1">(Próximamente)</div>
  </div>
</template>
<script setup>
// Vista de ecualizador
</script>
