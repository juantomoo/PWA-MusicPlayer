<template>
  <div class="fixed bottom-0 left-0 w-full bg-vaporwave2 text-white p-2 z-50 text-xs flex flex-col items-center">
    <div>Modo Debug Activo</div>
    <div>Entorno: {{ env }}</div>
    <div>PWA: <span>{{ pwaStatus }}</span></div>
    <div>Versión: 0.1.0</div>
    <div>Variables de entorno: <pre>{{ envVars }}</pre></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const env = import.meta.env.MODE;
const envVars = JSON.stringify(import.meta.env, null, 2);
const pwaStatus = ref('Desconocido');

onMounted(() => {
  if ('serviceWorker' in navigator) {
    pwaStatus.value = 'Service Worker soportado';
    if (navigator.serviceWorker.controller) {
      pwaStatus.value += ' (activo)';
    }
  } else {
    pwaStatus.value = 'No soportado';
  }
});
</script>

<style scoped>
</style>
