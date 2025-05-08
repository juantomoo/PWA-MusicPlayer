<template>
  <div class="text-center">
    <div class="font-bold text-vaporwave2 text-lg">{{ track.name }}</div>
    <div class="text-xs text-vaporwave4">{{ track.artist || 'Artista desconocido' }} - {{ track.album || 'Álbum desconocido' }} ({{ track.year || 'Año ?' }})</div>
  </div>
</template>
<script setup>
defineProps({ track: Object });
</script>