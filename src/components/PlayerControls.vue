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
</style>