<template>
  <div class="bg-vaporwave3 border-2 border-vaporwave5 rounded-none shadow-inner p-0 w-full max-w-md font-mono">
    <ul class="max-h-64 overflow-y-auto custom-scrollbar-vaporwave">
      <li v-for="(track, listIndex) in tracks" :key="track.id"
        class="flex items-center h-9 px-2 text-xs select-none cursor-pointer group transition-all duration-150"
        :class="[
          currentTrack && track.id === currentTrack.id
            ? 'bg-vaporwave1 text-vaporwave3 font-bold border-l-4 border-vaporwave2 shadow-[0_0_8px_var(--color-vaporwave1)]'
            : 'hover:bg-vaporwave2 hover:text-vaporwave4 hover:border-l-4 hover:border-vaporwave4 text-vaporwave4'
        ]">
        <span class="w-8 text-right text-vaporwave2 mr-2">{{ (listIndex + 1).toString().padStart(2, '0') }}.</span>
        <span class="truncate flex-1" :title="track.name">{{ track.name }}</span>
        <span v-if="track.favorite" class="text-vaporwave4 ml-2">★</span>
        <div class="flex gap-1 items-center ml-2">
          <button @click.stop="handlePlay(track.id)" class="px-1 py-0.5 text-xs bg-vaporwave3 border border-vaporwave2 text-vaporwave2 rounded-none group-hover:bg-vaporwave2 group-hover:text-vaporwave3 transition">▶</button>
          <button @click.stop="$emit('favorite', track)" class="px-1 py-0.5 text-xs bg-vaporwave3 border border-vaporwave4 text-vaporwave4 rounded-none group-hover:bg-vaporwave4 group-hover:text-vaporwave3 transition">{{ track.favorite ? '★' : '☆' }}</button>
          <button @click.stop="$emit('remove', track.id)" class="px-1 py-0.5 text-xs bg-vaporwave3 border border-vaporwave5 text-vaporwave5 rounded-none group-hover:bg-vaporwave5 group-hover:text-vaporwave3 transition">✕</button>
        </div>
      </li>
    </ul>
  </div>
</template>
<script setup>
import { usePlayerStore } from '../utils/playerStore.js';
import audioManager from '../utils/audioManager.js';

defineProps({ tracks: Array, currentTrack: Object });

const store = usePlayerStore();

function handlePlay(trackId) {
  const track = store.state.playlist.find(t => t.id === trackId) || store.state.favorites.find(t => t.id === trackId);
  if (track) {
    store.setTrack(track);
    store.setPlaying(true);
    if (track.fileHandle) {
      audioManager.playFile(track.fileHandle, store.state.volume);
    }
  }
}
</script>
<style scoped>
/* El resto de los estilos de scrollbar ya están en style.css global */
</style>