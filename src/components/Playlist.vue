<template>
  <div class="bg-vaporwave3/80 shadow rounded-none">
    <ul class="divide-y divide-vaporwave5/40">
      <li v-for="track in tracks" :key="track.id" 
          class="py-2 px-3 flex justify-between items-center hover:bg-vaporwave3/50 cursor-pointer transition-colors"
          :class="{ 'bg-vaporwave3': isCurrentTrack(track) }"
          @click="selectTrack(track)">
        
        <!-- Información principal de la pista -->
        <div class="flex items-center space-x-2 flex-grow overflow-hidden">
          <!-- Portada miniatura si existe -->
          <div v-if="track.coverUrl" class="w-10 h-10 flex-shrink-0">
            <img :src="track.coverUrl" alt="Cover" class="w-full h-full object-cover border border-vaporwave4/50" />
          </div>
          <div v-else class="w-10 h-10 flex-shrink-0 bg-vaporwave5/20 border border-vaporwave4/50 flex items-center justify-center text-vaporwave4/70">
            <span class="text-xs">🎵</span>
          </div>
          
          <!-- Información de texto -->
          <div class="overflow-hidden">
            <div class="font-medium text-white truncate">{{ track.name }}</div>
            <div class="text-vaporwave1 text-xs truncate">
              {{ track.artist || 'Desconocido' }} • {{ track.album || 'Álbum desconocido' }}
            </div>
          </div>
        </div>
        
        <!-- Controles de acciones -->
        <div class="flex items-center ml-2">
          <!-- Icono de reproducción o pausado -->
          <div v-if="isCurrentTrack(track)" class="mr-3 text-vaporwave4">
            <span v-if="isPlaying">▶️</span>
            <span v-else>⏸</span>
          </div>
          
          <!-- Favorito -->
          <button @click.stop="toggleFavorite(track)" class="text-lg p-1" :class="{ 'text-vaporwave2': track.favorite }">
            <span v-if="track.favorite">❤️</span>
            <span v-else>🤍</span>
          </button>
          
          <!-- Eliminar de la lista -->
          <button @click.stop="removeFromPlaylist(track)" class="text-lg p-1 ml-1 text-vaporwave1 hover:text-vaporwave2">
            <span>❌</span>
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import playerStore from '../store/playerStore';
import audioManager from '../utils/audioManager';
import favoritesManager from '../utils/favoritesManager';

const props = defineProps({
  tracks: {
    type: Array,
    required: true,
  },
  currentTrack: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['favorite', 'remove']);

const store = playerStore;
const isPlaying = computed(() => store.isPlaying);

// Comprobar si una pista es la actual
function isCurrentTrack(track) {
  return props.currentTrack && props.currentTrack.id === track.id;
}

// Seleccionar una pista
async function selectTrack(track) {
  if (track.fileHandle) {
    try {
      await audioManager.playFile(track.fileHandle);
      store.setTrack(track);
      store.play();
      
      // Actualizar MediaSession
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.name || 'Pista desconocida',
          artist: track.artist || 'Artista desconocido',
          album: track.album || 'Álbum desconocido',
          artwork: track.coverUrl ? [{ src: track.coverUrl, type: 'image/png' }] : []
        });
      }
    } catch (error) {
      console.error('Error al reproducir pista:', error);
    }
  }
}

// Marcar/desmarcar favorito
async function toggleFavorite(track) {
  const updated = await favoritesManager.toggleFavorite(track);
  emit('favorite', { ...track, favorite: updated });
}

// Eliminar de la lista
function removeFromPlaylist(track) {
  emit('remove', track.id);
}
</script>

<style scoped>
.custom-scrollbar-vaporwave::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar-vaporwave::-webkit-scrollbar-track {
  background: var(--color-vaporwave-bg, #242424);
}

.custom-scrollbar-vaporwave::-webkit-scrollbar-thumb {
  background-color: var(--color-vaporwave-list-border, #3D758C);
  border-radius: 0;
}

.custom-scrollbar-vaporwave::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-vaporwave-list-fav, #FDC47F);
}
</style>