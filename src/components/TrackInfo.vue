<template>
  <div class="bg-vaporwave3 border border-vaporwave5 p-2 flex items-center rounded-none">
    <!-- Miniatura de carátula -->
    <div class="flex-shrink-0">
      <div class="flex-shrink-0 overflow-hidden">
        <img 
          v-if="coverUrl" 
          :src="coverUrl" 
          alt="Carátula" 
          class="object-cover"
          @error="handleImageError"
        />
        <div v-else class="w-full h-full flex items-center justify-center bg-vaporwave5/20 text-vaporwave4/70">
          <span class="text-xs">🎵</span>
        </div>
      </div>
    </div>
    
    <!-- Información de la pista -->
    <div class="cinta-pista">
      <div>
        <h3 class="font-medium text-white truncate text-sm">
          {{ currentTrack?.name || currentTrack?.title || 'Sin reproducción' }} --
        </h3>
      </div>
      <div>
        <p class="text-xs text-vaporwave1 truncate">
          {{ currentTrack?.artist || 'Artista desconocido' }} -- 
        </p>
      </div>
      <div>
        <p class="text-xs text-vaporwave5 truncate">
          {{ currentTrack?.album || 'Álbum desconocido' }}
        </p>
      </div>                          
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { usePlayerStore } from '../store/playerStore';

const props = defineProps({
  track: {
    type: Object,
    default: () => ({})
  }
});

const playerStore = usePlayerStore();

// Estado
const currentTrack = computed(() => props.track || playerStore.state.currentTrack);
const coverUrl = ref(null);

// Extraer carátula
function extractCoverFromTrack(track) {
  if (!track) return null;
  
  if (track.coverUrl) {
    return track.coverUrl;
  }
  
  if (track.picture && track.picture.data) {
    try {
      const byteArray = new Uint8Array(track.picture.data);
      const blob = new Blob([byteArray], { type: `image/${track.picture.format || 'jpeg'}` });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error al convertir datos de imagen:', error);
    }
  }
  
  return null;
}

// Manejar error de imagen
function handleImageError() {
  coverUrl.value = null;
}

// Actualizar URL de carátula cuando cambia la pista
watch(currentTrack, (track) => {
  if (coverUrl.value && coverUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(coverUrl.value);
  }
  
  coverUrl.value = extractCoverFromTrack(track);
}, { immediate: true });
</script>