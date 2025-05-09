<template>
  <div class="bg-vaporwave3 border border-vaporwave1 rounded-none p-2">
    <div class="flex items-center justify-between">
      <!-- Controles principales -->
      <div class="flex items-center gap-4">
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
      
      <!-- Controles adicionales -->
      <div class="flex items-center gap-2">
        <button @click="toggleRepeat" class="player-btn-small" :class="{ 'active': repeatMode !== 'off' }">
          <span v-if="repeatMode === 'one'">🔂</span>
          <span v-else>🔁</span>
        </button>
        
        <button @click="toggleShuffle" class="player-btn-small" :class="{ 'active': shuffleMode }">
          <span>🔀</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { usePlayerStore } from '../utils/playerStore';
import audioManager from '../utils/audioManager';

const props = defineProps({
  isPlaying: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['prev', 'next', 'togglePlay']);

// Estado
const store = usePlayerStore();
const repeatMode = ref(store.state.repeat);
const shuffleMode = ref(store.state.shuffle);

// Reproducción / Pausa
function togglePlay() {
  emit('togglePlay');
}

// Pista anterior
function handlePrev() {
  emit('prev');
}

// Pista siguiente
function handleNext() {
  emit('next');
}

// Alternar repetición
function toggleRepeat() {
  store.toggleRepeat();
  repeatMode.value = store.state.repeat;
}

// Alternar reproducción aleatoria
function toggleShuffle() {
  store.toggleShuffle();
  shuffleMode.value = store.state.shuffle;
}

// Inicialización
onMounted(() => {
  // Configurar MediaSession API (controles multimedia del sistema)
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

// Limpieza
onBeforeUnmount(() => {
  // Limpiar manejadores de MediaSession
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('previoustrack', null);
    navigator.mediaSession.setActionHandler('nexttrack', null);
  }
});
</script>

<style scoped>
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
</style>