<template>
  <div class="flex flex-col items-center gap-4 p-4 w-full max-w-md mx-auto">
    <div v-if="coverUrl" class="w-44 h-44 rounded shadow overflow-hidden mb-2">
      <img :src="coverUrl" alt="Carátula" class="object-cover w-full h-full" />
    </div>
    <div v-if="track" class="w-full text-center">
      <div class="font-bold text-2xl text-vaporwave2 mb-1">{{ track.name }}</div>
      <div class="text-base text-vaporwave4 mb-1">{{ track.artist || 'Artista desconocido' }}</div>
      <div class="text-sm text-vaporwave4 mb-1">Álbum: <span class="font-semibold">{{ track.album || 'Desconocido' }}</span></div>
      <div class="text-xs text-vaporwave4 mb-2">Año: {{ track.year || '¿?' }}</div>
      <div v-if="track.duration" class="text-xs text-vaporwave4 mb-2">Duración: {{ track.duration }}</div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch, computed } from 'vue';
import { usePlayerStore } from '../utils/playerStore.js';

const store = usePlayerStore();
const coverUrl = ref(null);
const track = computed(() => store.state.currentTrack);

watch(() => store.state.currentTrack, async (t) => {
  coverUrl.value = t && t.coverUrl ? t.coverUrl : null;
}, { immediate: true });
</script>
