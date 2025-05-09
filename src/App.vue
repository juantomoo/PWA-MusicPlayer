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

<style>
/* Variables globales */
:root {
  --color-vaporwave1: #ff71ce;
  --color-vaporwave1-rgb: 255, 113, 206;
  --color-vaporwave2: #01cdfe;
  --color-vaporwave3: #05004e;
  --color-vaporwave4: #b967ff;
  --color-vaporwave5: #fffb96;
  
  --color-bg-dark: #0f0f1e;
  --color-bg-light: #1a1a2e;
  
  --color-text-primary: #ffffff;
  --color-text-secondary: rgba(255, 255, 255, 0.7);
  
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.4);
}

/* Estilos básicos */
html, body {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--color-bg-dark);
  color: var(--color-text-primary);
}

* {
  box-sizing: border-box;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

header {
  background-color: var(--color-bg-dark);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  box-shadow: var(--shadow-sm);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  height: 36px;
  width: auto;
}

nav {
  background-color: var(--color-bg-light);
  display: flex;
  justify-content: center;
  padding: 0.5rem;
  box-shadow: var(--shadow-sm);
}

nav a {
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  margin: 0 0.25rem;
  transition: all 0.2s ease;
}

nav a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

nav a.router-link-active {
  color: var(--color-vaporwave1);
  background-color: rgba(var(--color-vaporwave1-rgb), 0.1);
  font-weight: 500;
}

main {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background-color: var(--color-bg-dark);
  position: relative;
}

footer {
  background-color: var(--color-bg-light);
  padding: 0.75rem;
  z-index: 10;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
  font-weight: 500;
}

h1 {
  color: var(--color-vaporwave2);
  font-size: 1.5rem;
}

button {
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-bg-dark);
  z-index: 100;
}

/* Estilo para dispositivos móviles */
@media (max-width: 600px) {
  nav {
    overflow-x: auto;
    justify-content: flex-start;
  }
  
  nav a {
    white-space: nowrap;
  }
  
  .header-content h1 {
    font-size: 1.2rem;
  }
  
  .logo {
    height: 28px;
  }
}
</style>
