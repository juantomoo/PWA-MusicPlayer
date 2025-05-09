<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Tabs from './components/Tabs.vue';
import PlayerControls from './components/PlayerControls.vue';
import TrackInfo from './components/TrackInfo.vue';
import VolumeControl from './components/VolumeControl.vue';
import DevTools from './components/DevTools.vue';
import LoadingProgress from './components/LoadingProgress.vue';
// import DeviceFeatures from './components/DeviceFeatures.vue';
import { usePlayerStore } from './utils/playerStore.js';
import audioManager from './utils/audioManager.js';
import { getDirectoryHandle, clearDirectoryHandle } from './utils/playlistManager.js';

const isDev = import.meta.env.DEV;
const router = useRouter();
const route = useRoute();

// Variables para el seguimiento del progreso de carga
const isLoadingFiles = ref(false);
const totalFiles = ref(0);
const processedFiles = ref(0);

const tabs = [
  { name: 'NowPlaying', label: 'Reproduciendo', path: '/' },
  { name: 'Equalizer', label: 'Ecualizador', path: '/equalizer' },
  { name: 'Playlists', label: 'Listas', path: '/playlists' },
  { name: 'Letras', label: 'Letras', path: '/lyrics' },
];

function goToTab(tabName) {
  const tab = tabs.find(t => t.name === tabName);
  if (tab) router.push(tab.path);
}

// Estado simulado para la canción actual y volumen (luego conectar al store)
const currentTrack = ref({
  name: 'Canción de ejemplo',
  artist: 'Artista',
  album: 'Álbum',
  year: 2025
});
const isPlaying = ref(false);
const volume = ref(0.7);

const store = usePlayerStore();

function handleTogglePlay() {
  if (!store.state.currentTrack || !store.state.currentTrack.fileHandle) return;
  if (store.state.isPlaying) {
    audioManager.pause();
    store.pause();  // Use pause() instead of setPlaying(false)
  } else {
    // Si ya hay un archivo cargado, simplemente reanudar la reproducción
    // en lugar de volver a cargar el archivo desde el principio
    audioManager.play();
    store.play();   // Use play() instead of setPlaying(true)
  }
}

function handleVolume(val) {
  store.setVolume(val);
  audioManager.setVolume(val);
}

function handlePrev() {
  const prevTrack = store.playPrev();
  if (prevTrack && prevTrack.fileHandle) {
    audioManager.playFile(prevTrack.fileHandle)
      .then(() => {
        store.play();  // Use play() instead of setPlaying(true)
      })
      .catch(error => {
        console.error('Error al reproducir pista anterior:', error);
      });
  }
}

function handleNext() {
  const nextTrack = store.playNext();
  if (nextTrack && nextTrack.fileHandle) {
    audioManager.playFile(nextTrack.fileHandle)
      .then(() => {
        store.play();  // Use play() instead of setPlaying(true)
      })
      .catch(error => {
        console.error('Error al reproducir siguiente pista:', error);
      });
  }
}

const restoring = ref(false);
const restoreError = ref('');

async function scanDirectory(dirHandle) {
  try {
    const jsmediatags = window.jsmediatags;
    const tracks = [];
    const covers = {};
    const lyricsFiles = {};
    const playlistFiles = [];
    
    // 1. Indexar archivos por tipo
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const ext = entry.name.split('.').pop().toLowerCase();
        if (["jpg","jpeg","png"].includes(ext)) {
          covers[entry.name.replace(/\.[^.]+$/, '')] = entry;
        } else if (["lrc","txt"].includes(ext)) {
          lyricsFiles[entry.name.replace(/\.[^.]+$/, '')] = entry;
        } else if (["m3u","pls","json"].includes(ext)) {
          playlistFiles.push(entry);
        }
      }
    }
    
    // Contar archivos de audio y preparar la barra de progreso
    let totalAudio = 0;
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const ext = entry.name.split('.').pop().toLowerCase();
        if (["mp3","ogg","wav"].includes(ext)) totalAudio++;
      }
    }
    
    // Inicializar variables de progreso
    totalFiles.value = totalAudio;
    processedFiles.value = 0;
    isLoadingFiles.value = true;
    
    // Procesar archivos de audio
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const ext = entry.name.split('.').pop().toLowerCase();
        if (["mp3","ogg","wav"].includes(ext)) {
          const base = entry.name.replace(/\.[^.]+$/, '');
          let coverUrl = null;
          let lyrics = '';
          let meta = { name: entry.name };
          if (lyricsFiles[base]) {
            const file = await lyricsFiles[base].getFile();
            lyrics = await file.text();
          }
          const file = await entry.getFile();
          try {
            await new Promise(resolve => {
              jsmediatags.read(file, {
                onSuccess: tag => {
                  meta = {
                    name: tag.tags.title || entry.name,
                    artist: tag.tags.artist || '',
                    album: tag.tags.album || '',
                    year: tag.tags.year || '',
                    duration: '',
                  };
                  if (tag.tags.picture) {
                    const { data, format } = tag.tags.picture;
                    const byteArray = new Uint8Array(data);
                    coverUrl = URL.createObjectURL(new Blob([byteArray], { type: format }));
                  }
                  resolve();
                },
                onError: error => {
                  resolve();
                },
              });
            });
          } catch (err) {}
          if (!coverUrl && covers[base]) {
            const coverFile = await covers[base].getFile();
            coverUrl = URL.createObjectURL(coverFile);
          }
          tracks.push({
            id: crypto.randomUUID(),
            name: meta.name,
            artist: meta.artist,
            album: meta.album,
            year: meta.year,
            duration: meta.duration,
            fileHandle: entry,
            favorite: false,
            coverUrl,
            lyrics
          });
          
          // Actualizar el contador de progreso
          processedFiles.value++;
          await new Promise(r => setTimeout(r, 0)); // Permitir actualización del DOM
        }
      }
    }
    
    // Finalizar la carga
    store.setPlaylist(tracks);
    if (tracks.length) store.setTrack(tracks[0]);
    
    // Ocultar la barra de progreso después de un breve retraso
    setTimeout(() => {
      isLoadingFiles.value = false;
    }, 1000);
  } catch (e) {
    isLoadingFiles.value = false;
    restoreError.value = 'No se pudo acceder al directorio. Selecciona uno nuevo.';
    await clearDirectoryHandle();
  }
}

// Configurar eventos de audio para actualizar el estado global
function setupAudioEvents() {
  // Actualizar tiempo actual en el store
  audioManager.onTimeUpdate(() => {
    store.updateCurrentTime(audioManager.getCurrentTime());
  });
  
  // Depuración para el banner de progreso
  watch(isLoadingFiles, (newVal) => {
    console.log('isLoadingFiles cambió a:', newVal);
  });
  
  watch(totalFiles, (newVal) => {
    console.log('totalFiles cambió a:', newVal);
  });
  
  watch(processedFiles, (newVal) => {
    console.log('processedFiles cambió a:', newVal);
  });
  
  // Actualizar duración cuando se carga un audio
  const audioElement = document.querySelector('audio');
  if (audioElement) {
    audioElement.addEventListener('durationchange', (event) => {
      let duration = 0;
      if (event.detail && event.detail.duration) {
        duration = event.detail.duration;
      } else if (audioElement.duration) {
        duration = audioElement.duration;
      }
      store.updateDuration(duration);
    });
    
    // Manejar fin de reproducción
    audioElement.addEventListener('ended', () => {
      if (store.state.repeat === 'one') {
        // Si está en modo repetir uno, reproducir la misma pista
        audioManager.seekTo(0);
        audioManager.play();
      } else {
        // Reproducir siguiente
        handleNext();
      }
    });
  }
}

// Formatear tiempo en formato mm:ss
function formatTime(seconds) {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Función para buscar pista en progreso específico
function handleSeek(event) {
  const time = parseFloat(event.target.value);
  audioManager.seekTo(time);
}

onMounted(async () => {
  // Inicializar audioManager manualmente al inicio
  audioManager.init();
  
  // Configurar eventos de audio
  setupAudioEvents();
  
  // Registrar callback para actualización de tiempo continua
  audioManager.onTimeUpdate((currentTime, duration) => {
    store.updateCurrentTime(currentTime);
    if (duration && duration > 0) {
      store.updateDuration(duration);
    }
  });

  // Mostrar los datos actuales del reproductor en consola para depuración
  const audioElement = document.getElementById('audio-player');
  if (audioElement) {
    console.log('Audio element loaded successfully:', audioElement);
  }
  
  restoring.value = true;
  restoreError.value = '';
  
  // Intentar restaurar el último directorio
  const lastHandle = await getDirectoryHandle();
  if (lastHandle) {
    try {
      const perm = await lastHandle.requestPermission({ mode: 'read' });
      if (perm === 'granted') {
        await scanDirectory(lastHandle);
      } else {
        restoreError.value = 'Permiso denegado para acceder al directorio anterior.';
      }
    } catch (e) {
      restoreError.value = 'No se pudo acceder al directorio anterior. Selecciona uno nuevo.';
    }
  }
  restoring.value = false;

  // Configurar atajos de teclado para control de reproducción
  window.addEventListener('keydown', (e) => {
    // Solo si no está en un campo de texto
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    switch (e.code) {
      case 'Space': // Reproducir/Pausar con espacio
        e.preventDefault();
        handleTogglePlay();
        break;
      case 'ArrowRight': // Avanzar con flecha derecha
        if (e.ctrlKey || e.metaKey) {
          handleNext();
        } else {
          // Avanzar 5 segundos
          const newTime = Math.min(store.state.currentTime + 5, store.state.duration);
          handleSeek(newTime);
        }
        break;
      case 'ArrowLeft': // Retroceder con flecha izquierda
        if (e.ctrlKey || e.metaKey) {
          handlePrev();
        } else {
          // Retroceder 5 segundos
          const newTime = Math.max(store.state.currentTime - 5, 0);
          handleSeek(newTime);
        }
        break;
    }
  });
});
</script>

<template>
  <div id="app-container" class="h-screen flex flex-col overflow-hidden">
    <!-- Header fijo en la parte superior -->
    <header class="bg-vaporwave5 z-30 shadow-lg">
      <div class="flex items-center justify-between px-4 py-2">
        <div class="flex items-center gap-2">
          <img src="/icons/icon-192x192.png" alt="Logo" class="logo-head" />
          <span class="text-xl font-bold tracking-wide">PWA Music Player</span>
        </div>
      </div>
    </header>
    
    <!-- Navegación de pestañas -->
    <div class="z-20 bg-vaporwave3">
      <Tabs />
    </div>
    
    <!-- Contenido principal con scroll -->
    <main class="flex-grow overflow-y-auto pb-36">
      <RouterView />
    </main>
    
    <!-- Elemento de audio oculto para reproducción -->
    <audio id="audio-player" style="display:none"></audio>
    
    <!-- Banner de progreso de carga (fuera del footer) -->
    <LoadingProgress
      :loading="isLoadingFiles"
      :processed="processedFiles"
      :total="totalFiles"
    />
    
    <!-- Footer con controles fijo en la parte inferior -->
    <footer class="bottom-0 left-0 right-0 bg-vaporwave5 shadow-lg z-30 pb-safe relative">
      <div class="footer-info">
        <!-- Información de la pista -->
        <TrackInfo :track="store.state.currentTrack || { name: 'Sin pista', artist: '', album: '', year: '' }" class="info-pista" />
        
        <!-- Barra de progreso (slider y tiempos) -->
        <div class="mt-2 mb-2">
          <div class="flex justify-between text-xs text-vaporwave4 mb-1">
            <span>{{ formatTime(store.state.currentTime) }}</span>
            <span>{{ formatTime(store.state.duration) }}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            :max="store.state.duration" 
            :value="store.state.currentTime"
            :style="{ backgroundSize: `${store.state.progressPercentage}% 100%` }"
            step="0.1"
            @input="handleSeek"
            class="w-full accent-vaporwave4 cursor-pointer progress-slider"
          />
        </div>
        
        <!-- Controles de reproducción y volumen -->
        <div class="mt-2 flex items-center justify-between gap-2 controles">
          <div class="w-4/6">
            <PlayerControls 
              :is-playing="store.state.isPlaying" 
              @prev="handlePrev" 
              @togglePlay="handleTogglePlay" 
              @next="handleNext" 
            />
          </div>
          <div class="w-2/6">
            <VolumeControl :model-value="store.state.volume" @update:modelValue="handleVolume" />
          </div>
        </div>
        
        <div class="text-vaporwave4 py-1 desarrollador">
          &copy; 2025 HISQUE Estudio
        </div>
      </div>
    </footer>
    
    <!-- DevTools en modo desarrollo -->
    <DevTools v-if="isDev" />
  </div>
</template>

<style>
body {
  background: #552A93;
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100vh;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.content-main {
  flex: 1;
  overflow-y: auto;
  padding-top: 130px; /* Espacio para header y tabs */
  padding-bottom: 140px; /* Espacio para footer */
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

:root {
  --color-vaporwave1: #48CBA9;
  --color-vaporwave2: #E5156D;
  --color-vaporwave3: #552A93;
  --color-vaporwave4: #FDC47F;
  --color-vaporwave5: #3D758C;

  /* Variables adicionales para componentes específicos */
  --color-vaporwave-bg: #242424;
  --color-vaporwave-list-fav: #FDC47F;
  --color-vaporwave-list-border: #3D758C;
}

/* Estilos para el scroll */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-vaporwave3);
}

::-webkit-scrollbar-thumb {
  background-color: var(--color-vaporwave4);
  border-radius: 0;
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-vaporwave2);
}

/* Estilos para el slider de progreso */
.progress-slider {
  -webkit-appearance: none;
  height: 6px;
  background: var(--color-vaporwave3);
  border-radius: 0;
  background-image: linear-gradient(var(--color-vaporwave4), var(--color-vaporwave4));
  background-repeat: no-repeat;
  transition: background-size 0.2s ease;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: var(--color-vaporwave4);
  border: 1px solid var(--color-vaporwave2);
  border-radius: 50%;
  cursor: pointer;
}

.progress-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--color-vaporwave4);
  border: 1px solid var(--color-vaporwave2);
  border-radius: 50%;
  cursor: pointer;
}

.progress-slider::-ms-thumb {
  width: 14px;
  height: 14px;
  background: var(--color-vaporwave4);
  border: 1px solid var(--color-vaporwave2);
  border-radius: 50%;
  cursor: pointer;
}

.progress-slider:hover::-webkit-slider-thumb {
  background: var(--color-vaporwave1);
}

.progress-slider:hover::-moz-range-thumb {
  background: var(--color-vaporwave1);
}

.progress-slider:hover::-ms-thumb {
  background: var(--color-vaporwave1);
}

/* Variables específicas de este componente */
#app-container {
  background-color: var(--color-vaporwave3);
  color: white;
}

/* Soporte para notch y áreas seguras en dispositivos móviles */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
