<template>
  <div class="flex flex-col items-center gap-4 p-4 w-full max-w-md mx-auto">
    <div class="flex justify-between w-full mb-2">
      <button @click="mode = 'sync'" :class="mode === 'sync' ? 'bg-vaporwave2 text-white' : 'bg-vaporwave5 text-vaporwave2'" class="px-3 py-1 rounded-l">Sincronizada</button>
      <button @click="mode = 'full'" :class="mode === 'full' ? 'bg-vaporwave2 text-white' : 'bg-vaporwave5 text-vaporwave2'" class="px-3 py-1 rounded-r">Completa</button>
    </div>
    <div v-if="!lyricsLines.length" class="text-vaporwave4 text-center">No hay letras disponibles para esta pista.</div>
    <div v-else-if="mode === 'sync'" class="w-full max-w-md h-64 overflow-y-auto bg-vaporwave3 rounded p-4 flex flex-col items-center justify-center">
      <div v-for="(line, idx) in lyricsLines" :key="idx" :class="[idx === currentLine ? 'text-vaporwave1 font-bold text-lg' : 'text-vaporwave4 opacity-60', 'transition-all duration-200 mb-1']">
        {{ line.text }}
      </div>
    </div>
    <div v-else class="w-full max-w-md h-64 overflow-y-auto bg-vaporwave3 rounded p-4">
      <div v-for="(line, idx) in lyricsLines" :key="idx" class="text-vaporwave4 mb-1 whitespace-pre-line">{{ line.text }}</div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { usePlayerStore } from '../utils/playerStore.js';

const store = usePlayerStore();
const mode = ref('sync');
const lyricsLines = ref([]); // [{ time: Number|null, text: String }]
const currentLine = ref(0);
let interval = null;

function parseLyrics(lyrics) {
  if (!lyrics) return [];
  // LRC: [mm:ss.xx] línea
  const lines = lyrics.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return lines.map(line => {
    const match = line.match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\](.*)$/);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(2, '0'), 10) : 0;
      const time = min * 60 + sec + ms / 100;
      return { time, text: match[4].trim() };
    } else {
      return { time: null, text: line };
    }
  });
}

watch(() => store.state.currentTrack, (track) => {
  lyricsLines.value = parseLyrics(track && track.lyrics ? track.lyrics : '');
  currentLine.value = 0;
}, { immediate: true });

function updateCurrentLine() {
  if (!lyricsLines.value.length) return;
  const audio = document.querySelector('audio');
  if (!audio) return;
  const time = audio.currentTime;
  let idx = 0;
  for (let i = 0; i < lyricsLines.value.length; i++) {
    if (lyricsLines.value[i].time !== null && lyricsLines.value[i].time <= time) {
      idx = i;
    }
  }
  currentLine.value = idx;
}

onMounted(() => {
  interval = setInterval(() => {
    if (mode.value === 'sync') updateCurrentLine();
  }, 300);
});
onUnmounted(() => { clearInterval(interval); });
</script>
