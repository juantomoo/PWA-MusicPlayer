<template>
  <div class="now-playing sombra-alt">
    <div v-if="currentTrack" class="track-container">
      <div class="cover-container">
        <img v-if="coverImageUrl" :src="coverImageUrl" alt="Cover Art" class="cover-art sombra" @load="revokePreviousCover" />
        <div v-else class="cover-placeholder sombra-alt">
          <span>🎵</span>
        </div>
      </div>
      <div class="track-info sombra-alt">
        <h2 class="track-title">{{ currentTrack.name || 'Nombre desconocido' }}</h2>
        <h3 class="artist-name">{{ currentTrack.artist || 'Artista desconocido' }}</h3>
        <p class="album-title">{{ currentTrack.album || 'Álbum desconocido' }}</p>
        
        <!-- Información adicional -->
        <div class="track-metadata sombra">
          <div class="metadata-item" v-if="duration">
            <span class="metadata-label">Duración:</span>
            <span class="metadata-value">{{ formatTime(duration) }}</span>
          </div>
          <div class="metadata-item" v-if="currentTimeFormatted">
            <span class="metadata-label">Tiempo actual:</span>
            <span class="metadata-value">{{ currentTimeFormatted }}</span>
          </div>
          <div class="metadata-item" v-if="currentTrack.genre">
            <span class="metadata-label">Género:</span>
            <span class="metadata-value">{{ currentTrack.genre }}</span>
          </div>
          <div class="metadata-item" v-if="currentTrack.year">
            <span class="metadata-label">Año:</span>
            <span class="metadata-value">{{ currentTrack.year }}</span>
          </div>
          <div class="metadata-item" v-if="currentTrack.fileHandle && currentTrack.fileHandle.name">
            <span class="metadata-label">Archivo:</span>
            <span class="metadata-value" style="word-break: break-all;">{{ currentTrack.fileHandle.name }}</span>
          </div>
          <div class="metadata-item" v-if="currentTrack.fileHandle && currentTrack.fileHandle.relativePath">
            <span class="metadata-label">Ruta:</span>
            <span class="metadata-value" style="word-break: break-all;">{{ currentTrack.fileHandle.relativePath }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="no-track">
      <div class="no-track-icon">
        <span>🎧</span>
      </div>
      <h2>No hay pista seleccionada</h2>
      <p class="hint">Selecciona una canción desde la vista de Playlists</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watchEffect, onBeforeUnmount } from 'vue';
import { usePlayerStore } from '../store/playerStore';
import audioManager from '../utils/audioManager';

const playerStore = usePlayerStore();
const currentTrack = computed(() => playerStore.currentTrack);
const currentTime = ref(0);
const duration = ref(0);

// Solo se mantiene la carátula de la pista actual
let previousCoverUrl = null;
const coverImageUrl = computed(() => {
  const track = currentTrack.value;
  if (!track) return null;
  if (track.coverArt) return track.coverArt;
  if (track.coverUrl) return track.coverUrl;
  return null;
});

function revokePreviousCover() {
  if (previousCoverUrl && previousCoverUrl.startsWith('blob:')) {
    URL.revokeObjectURL(previousCoverUrl);
  }
  previousCoverUrl = coverImageUrl.value;
}

onBeforeUnmount(() => {
  if (previousCoverUrl && previousCoverUrl.startsWith('blob:')) {
    URL.revokeObjectURL(previousCoverUrl);
  }
});

// Formateador de tiempo (mm:ss)
const formatTime = (timeInSeconds) => {
  if (!timeInSeconds || isNaN(timeInSeconds)) return '00:00';
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Tiempo actual formateado
const currentTimeFormatted = computed(() => formatTime(currentTime.value));

// Actualizar tiempo y duración
watchEffect(() => {
  if (playerStore.currentTime !== undefined) {
    currentTime.value = playerStore.currentTime;
  }
  
  if (playerStore.duration !== undefined) {
    duration.value = playerStore.duration;
  }
});

// En la lógica de coverImageUrl y metadatos, no se filtra por extensión, así que ya es agnóstico a mp3, flac, wav.
// No se requiere cambio aquí, pero asegúrate de que la lógica de playlistManager y audioManager acepte flac y wav.
</script>

<style scoped>
.now-playing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-md);
  overflow-y: auto;
}

.track-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  padding: var(--space-lg);
  background-color: var(--color-bg-dark);
  height: inherit;
}

@media (min-width: 768px) {
  .track-container {
    flex-direction: row;
    align-items: flex-start;
    text-align: left;
  }
}

.cover-container {
  margin-bottom: var(--space-md);
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .cover-container {
    margin-bottom: 0;
    margin-right: var(--space-xl);
  }
}

.cover-art {
  width: 75%;
  height: 75%;
  object-fit: cover;
  border-radius: 4px;
}

.cover-placeholder {
  width: 300px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-vaporwave5);
  background-image: linear-gradient(45deg, var(--color-vaporwave5) 0%, var(--color-vaporwave4) 100%);
  border-radius: 10px;
  font-size: 100px;
}

.track-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2rem;
}

.track-title {
  font-size: 2rem;
  margin: var(--space-md) 0 var(--space-sm);
  color: var(--color-vaporwave1);
  text-shadow: 0 0 10px rgba(var(--color-vaporwave1-rgb), 0.5);
}

.artist-name {
  font-size: 1.5rem;
  margin: 0 0 var(--space-sm);
  color: var(--color-vaporwave4);
}

.album-title {
  font-size: 1.2rem;
  margin: 0 0 var(--space-md);
  color: white;
  opacity: 0.8;
}

.track-metadata {
  margin-top: var(--space-lg);
  border-radius: 2px;
  padding: var(--space-md);
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  padding: var(--space-xs) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.metadata-item:last-child {
  border-bottom: none;
}

.metadata-label {
  font-weight: bold;
  color: var(--color-vaporwave2);
}

.metadata-value {
  color: white;
}

.no-track {
  margin: auto;
  padding: var(--space-xl);
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 100%;
}

.no-track-icon {
  font-size: 5rem;
  margin-bottom: var(--space-md);
  opacity: 0.5;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

.no-track h2 {
  font-size: 1.5rem;
  margin-bottom: var(--space-sm);
  color: var(--color-vaporwave4);
}

.hint {
  font-size: 1rem;
  opacity: 0.7;
  color: var(--color-text-secondary);
}
</style>
