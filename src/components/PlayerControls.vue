<template>
  <div class="player-controls-wrapper">
    <!-- Barra de progreso -->
    <div class="progress-bar-container">
      <span class="time-label">{{ formatTime(currentTime) }}</span>
      <input
        type="range"
        min="0"
        :max="duration"
        step="0.1"
        :value="currentTime"
        @input="onSeek"
        class="progress-bar"
      />
      <span class="time-label">{{ formatTime(duration) }}</span>
    </div>

    <!-- Información de la pista actual -->
    <div class="track-info-slider">
      <div class="track-info-content" v-if="currentTrack">
        <span class="track-title">{{ currentTrack?.name || 'Sin reproducción' }}</span>
        <span class="track-artist"> - {{ currentTrack?.artist || 'Artista desconocido' }}</span>
        <span class="track-album"> - {{ currentTrack?.album || 'Álbum desconocido' }}</span>
        <span class="track-year" v-if="currentTrack?.year"> - {{ currentTrack.year }}</span>
      </div>
      <div class="track-info-content" v-else>
        <span class="track-title">Selecciona una canción para reproducir</span>
      </div>
    </div>

    <div class="controls-row">
      <div class="main-controls">
        <button @click="handlePrev" class="player-btn">
          <span>⏮</span>
        </button>
        <button @click="togglePlay" class="player-btn-large">
          <span>{{ isPlaying ? '⏸' : '▶️' }}</span>
        </button>
        <button @click="handleNext" class="player-btn">
          <span>⏭</span>
        </button>
      </div>
      <div class="extra-controls">
        <button @click="toggleRepeat" class="player-btn-small" :class="{ 'active': isRepeat }">
          <span>🔁</span>
        </button>
        <button @click="toggleShuffle" class="player-btn-small" :class="{ 'active': isShuffle }">
          <span>🔀</span>
        </button>
        <VolumeControl :model-value="volume" @update:modelValue="onVolumeChange" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { usePlayerStore } from '../store/playerStore';
import audioManager from '../utils/audioManager';
import VolumeControl from './VolumeControl.vue';

const playerStore = usePlayerStore();

// Estado basado en Pinia
const currentTrack = computed(() => playerStore.currentTrack);
const isPlaying = computed(() => playerStore.isPlaying);
const isShuffle = computed(() => playerStore.isShuffle);
const isRepeat = computed(() => playerStore.isRepeat);
const volume = computed(() => playerStore.volume);

// Estado local
const currentTime = ref(0);
const duration = ref(0);

// Actualizar el tiempo actual y duración desde el audioManager
onMounted(() => {
  // Inicializar AudioManager si no está inicializado
  if (!audioManager.initialized) {
    audioManager.initialize();
  }
  
  // Configurar el audio element para escuchar eventos
  const audioElement = document.getElementById('audio-player');
  if (audioElement) {
    // Actualizar tiempo
    audioElement.addEventListener('timeupdate', () => {
      currentTime.value = audioElement.currentTime;
    });
    
    // Actualizar duración cuando se carga
    audioElement.addEventListener('loadedmetadata', () => {
      duration.value = audioElement.duration;
    });
    
    // Manejar fin de reproducción
    audioElement.addEventListener('ended', handleTrackEnd);
    
    // Sincronizar volumen con el store
    setVolume(playerStore.volume);
  }
  
  // Configurar MediaSession API
  setupMediaSessionHandlers();
});

// Limpiar event listeners
onBeforeUnmount(() => {
  const audioElement = document.getElementById('audio-player');
  if (audioElement) {
    audioElement.removeEventListener('timeupdate', () => {});
    audioElement.removeEventListener('loadedmetadata', () => {});
    audioElement.removeEventListener('ended', handleTrackEnd);
  }
  
  // Remover handlers de Media Session
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('previoustrack', null);
    navigator.mediaSession.setActionHandler('nexttrack', null);
  }
});

// Formatear tiempo en formato mm:ss
function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// Controlar la reproducción
function togglePlay() {
  if (!currentTrack.value) return;
  
  if (isPlaying.value) {
    audioManager.pause();
    playerStore.setPlayingState(false);
  } else {
    if (currentTrack.value.fileHandle) {
      audioManager.playFile(currentTrack.value.fileHandle)
        .then(() => playerStore.setPlayingState(true))
        .catch(error => console.error('Error reproduciendo:', error));
    }
  }
}

// Ir a pista anterior
async function handlePrev() {
  const track = playerStore.playPrevious();
  if (track && track.fileHandle) {
    try {
      await audioManager.playFile(track.fileHandle);
      playerStore.setPlayingState(true);
    } catch (error) {
      console.error('Error reproduciendo pista anterior:', error);
    }
  }
}

// Ir a siguiente pista
async function handleNext() {
  const track = playerStore.playNext();
  if (track && track.fileHandle) {
    try {
      await audioManager.playFile(track.fileHandle);
      playerStore.setPlayingState(true);
    } catch (error) {
      console.error('Error reproduciendo siguiente pista:', error);
    }
  }
}

// Manejar fin de pista
function handleTrackEnd() {
  if (isRepeat.value) {
    // Si está en modo repetición, vuelve a reproducir la pista actual
    if (currentTrack.value && currentTrack.value.fileHandle) {
      audioManager.playFile(currentTrack.value.fileHandle)
        .catch(error => console.error('Error en repetición:', error));
    }
  } else {
    // Si no, reproduce la siguiente
    handleNext();
  }
}

// Cambiar posición de reproducción
function onSeek(event) {
  const newTime = parseFloat(event.target.value);
  audioManager.setCurrentTime(newTime);
}

// Cambiar volumen
function onVolumeChange(newVolume) {
  setVolume(newVolume);
}

function setVolume(value) {
  audioManager.setVolume(value);
  playerStore.setVolume(value);
}

// Alternar modo repetición
function toggleRepeat() {
  playerStore.toggleRepeat();
}

// Alternar modo aleatorio
function toggleShuffle() {
  playerStore.toggleShuffle();
}

// Configurar MediaSession API
function setupMediaSessionHandlers() {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', togglePlay);
    navigator.mediaSession.setActionHandler('pause', togglePlay);
    navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
    navigator.mediaSession.setActionHandler('nexttrack', handleNext);
    
    // Actualizar metadata cuando cambie la pista
    watch(currentTrack, (newTrack) => {
      if (newTrack) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: newTrack.name || 'Desconocido',
          artist: newTrack.artist || 'Artista desconocido',
          album: newTrack.album || 'Álbum desconocido',
          artwork: newTrack.coverUrl ? [{ src: newTrack.coverUrl }] : []
        });
      }
    });
  }
}
</script>

<style scoped>
.player-controls-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--color-vaporwave5);
  border-radius: 3px;
  accent-color: var(--color-vaporwave1);
  cursor: pointer;
}
.time-label {
  font-size: 0.9em;
  color: var(--color-vaporwave1);
  min-width: 40px;
  text-align: center;
}
.track-info-slider {
  overflow: hidden;
  white-space: nowrap;
  margin-bottom: 8px;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 5px 10px;
  border-radius: 4px;
  height: 24px;
}
.track-info-content {
  display: inline-block;
  animation: slide 15s linear infinite;
}
.track-title, .track-artist, .track-album, .track-year {
  font-size: 0.9em;
  color: var(--color-vaporwave1);
}
@keyframes slide {
  0% { transform: translateX(100%); }
  10% { transform: translateX(0%); }
  90% { transform: translateX(0%); }
  100% { transform: translateX(-100%); }
}
.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.main-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.extra-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.player-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-vaporwave4);
  background-color: var(--color-vaporwave3);
  border: 1px solid var(--color-vaporwave5);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.player-btn-large {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background-color: var(--color-vaporwave1);
  border: 1px solid var(--color-vaporwave1);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.1em;
}
.player-btn-small {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-vaporwave1);
  background-color: transparent;
  border: 1px solid var(--color-vaporwave5);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.player-btn-small.active {
  color: white;
  background-color: var(--color-vaporwave1);
}
.player-btn:hover, 
.player-btn-large:hover {
  transform: scale(1.05);
  opacity: 0.9;
}
.player-btn-small:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>