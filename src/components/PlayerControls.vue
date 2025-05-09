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
      <div class="track-info-content">
        <span class="track-title">{{ currentTrack?.name || 'Sin reproducción' }}</span>
        <span class="track-artist"> - {{ currentTrack?.artist || 'Artista desconocido' }}</span>
        <span class="track-album"> - {{ currentTrack?.album || 'Álbum desconocido' }}</span>
        <span class="track-year" v-if="currentTrack?.year"> - {{ currentTrack.year }}</span>
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
        <button @click="toggleRepeat" class="player-btn-small" :class="{ 'active': repeatMode !== 'off' }">
          <span v-if="repeatMode === 'one'">🔂</span>
          <span v-else>🔁</span>
        </button>
        <!-- Texto de modo de repetición -->
        <span v-if="repeatLabel" class="repeat-label">{{ repeatLabel }}</span>
        <button @click="toggleShuffle" class="player-btn-small" :class="{ 'active': shuffleMode }">
          <span>🔀</span>
        </button>
        <VolumeControl :model-value="volume" @update:modelValue="onVolumeChange" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import playerStore from '../store/playerStore';
import audioManager from '../utils/audioManager';
import VolumeControl from './VolumeControl.vue';

const playlist = computed(() => playerStore.playlist);
const currentTrack = computed(() => playerStore.currentTrack);
const isPlaying = computed(() => playerStore.isPlaying);
const repeatMode = computed(() => playerStore.repeat);
const shuffleMode = computed(() => playerStore.shuffle);
const currentTime = computed(() => playerStore.currentTime);
const duration = computed(() => playerStore.duration);
const volume = computed(() => playerStore.volume);

// Etiqueta para modo de repetición
const repeatLabel = computed(() => {
  if (repeatMode.value === 'one') return '1';
  if (repeatMode.value === 'all') return 'All';
  return '';
});

function playTrack(track) {
  playerStore.setTrack(track);
  if (track && track.fileHandle) {
    audioManager.playFile(track.fileHandle);
  }
}

function togglePlay() {
  if (!currentTrack.value) return;
  if (isPlaying.value) {
    audioManager.pause();
  } else {
    audioManager.playFile(currentTrack.value.fileHandle);
  }
}

async function handlePrev() {
  const track = playerStore.prevTrack();
  if (track && track.fileHandle) {
    try {
      await audioManager.playFile(track.fileHandle);
    } catch (e) {
      console.error('Error al reproducir pista anterior:', e);
    }
  }
}

async function handleNext() {
  const track = playerStore.nextTrack();
  if (track && track.fileHandle) {
    try {
      await audioManager.playFile(track.fileHandle);
    } catch (e) {
      console.error('Error al reproducir siguiente pista:', e);
    }
  }
}

function toggleRepeat() {
  playerStore.toggleRepeat();
}

function toggleShuffle() {
  playerStore.toggleShuffle();
}

function onSeek(event) {
  const newTime = parseFloat(event.target.value);
  audioManager.setCurrentTime(newTime);
}

function onVolumeChange(newVolume) {
  audioManager.setVolume(newVolume);
}

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

onMounted(() => {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => {
      togglePlay();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      togglePlay();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      handlePrev();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      handleNext();
    });
  }
});

onBeforeUnmount(() => {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('previoustrack', null);
    navigator.mediaSession.setActionHandler('nexttrack', null);
  }
});
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
  height: 4px;
  background: var(--color-vaporwave5);
  border-radius: 2px;
  accent-color: var(--color-vaporwave4);
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
}
.track-info-content {
  display: inline-block;
  animation: slide 10s linear infinite;
}
.track-title, .track-artist, .track-album, .track-year {
  font-size: 0.9em;
  color: var(--color-vaporwave1);
}
@keyframes slide {
  0% { transform: translateX(100%); }
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
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-vaporwave4);
  background-color: var(--color-vaporwave3);
  border: 1px solid var(--color-vaporwave5);
  cursor: pointer;
}
.player-btn-large {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background-color: var(--color-vaporwave5);
  border: 1px solid var(--color-vaporwave1);
  cursor: pointer;
}
.player-btn-small {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-vaporwave1);
  background-color: transparent;
  border: 1px solid var(--color-vaporwave5);
  cursor: pointer;
}
.player-btn-small.active {
  color: var(--color-vaporwave2);
  background-color: var(--color-vaporwave3);
}
.player-btn:hover, 
.player-btn-large:hover, 
.player-btn-small:hover {
  opacity: 0.8;
}
.repeat-label {
  margin-left: 4px;
  font-size: 0.8em;
  color: var(--color-vaporwave1);
}
</style>