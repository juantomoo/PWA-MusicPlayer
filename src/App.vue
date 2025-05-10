<template>
  <div id="app">
    <header>
      <div class="header-content">
        <img src="/icons/icon-192x192.png" alt="Logo" class="logo" />
        <h1>PWA Music Player</h1>
      </div>
    </header>

    <nav>
      <router-link to="/">Reproduciendo</router-link>
      <router-link to="/playlists">Playlists</router-link>
      <router-link to="/equalizer">Ecualizador</router-link>
      <router-link to="/lyrics">Letras</router-link>
    </nav>

    <main>
      <router-view v-if="!isLoading"></router-view>
      <div v-else class="loading-container">
        <LoadingProgress :progress="loadingProgress" />
      </div>
    </main>

    <footer>
      <PlayerControls />
      <audio id="audio-player" style="display:none"></audio>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import PlayerControls from './components/PlayerControls.vue';
import LoadingProgress from './components/LoadingProgress.vue';
import { usePlayerStore } from './store/playerStore';
import audioManager from './utils/audioManager';

// Referencias reactivas
const isLoading = ref(true);
const loadingProgress = ref(0);
const playerStore = usePlayerStore();

// Inicializar la aplicación
onMounted(async () => {
  try {
    // Mostrar progreso de carga
    loadingProgress.value = 10;
    
    // Inicializar audio manager (necesario hacerlo en respuesta a interacción de usuario)
    document.addEventListener('click', initAudioContext, { once: true });
    
    // Cargar el estado guardado del reproductor
    loadingProgress.value = 30;
    const trackId = await playerStore.loadState();
    
    // Inicializar el playerStore
    loadingProgress.value = 60;
    
    // Simular finalización de carga
    loadingProgress.value = 100;
    
    // Ocultar pantalla de carga
    setTimeout(() => {
      isLoading.value = false;
    }, 500);
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    isLoading.value = false;
  }
});

// Inicializar el contexto de audio en respuesta a interacción del usuario
function initAudioContext() {
  if (!audioManager.initialized) {
    audioManager.initialize();
  }
}
</script>