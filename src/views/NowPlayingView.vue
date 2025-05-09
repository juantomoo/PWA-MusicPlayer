<template>
  <div class="flex flex-col gap-4 p-2">
    <div class="bg-vaporwave5 border-2 border-vaporwave2 rounded-none shadow-lg p-4 text-center relative">
      <!-- Botón para seleccionar carpeta de música -->
      <button @click="openDirectoryPicker" 
              class="absolute top-2 right-2 p-1 bg-vaporwave3 hover:bg-vaporwave2 text-white rounded-none">
        <span v-if="!store.state.playlist.length">📁</span>
        <span v-else>🔄</span>
      </button>
      
      <!-- Botón para añadir a playlist -->
      <button v-if="store.state.currentTrack"
              @click="showAddToPlaylistModal = true" 
              class="absolute top-2 left-2 p-1 bg-vaporwave3 hover:bg-vaporwave2 text-white rounded-none"
              title="Añadir a lista de reproducción">
        ➕
      </button>
      
      <!-- Imagen del álbum / cover -->
      <div class="w-full aspect-square max-w-64 mx-auto bg-vaporwave3/30 border-2 border-vaporwave4 flex items-center justify-center mb-3 overflow-hidden">
        <img v-if="currentAlbumCover" :src="currentAlbumCover" alt="Album cover" class="portada">
        <div v-else class="text-6xl">🎵</div>
      </div>
      
      <!-- Información de la pista -->
      <div class="text-white">
        <h2 class="text-xl font-bold text-vaporwave4 truncate">
          {{ store.state.currentTrack?.name || 'No hay pista seleccionada' }}
        </h2>
        <p class="text-vaporwave1">
          {{ store.state.currentTrack?.artist || 'Selecciona una carpeta con música' }}
        </p>
        <p class="text-sm text-vaporwave4/80">
          {{ store.state.currentTrack?.album || 'Álbum desconocido' }} 
          {{ store.state.currentTrack?.year ? `(${store.state.currentTrack.year})` : '' }}
        </p>
      </div>
    </div>
    
    <!-- Lista de reproducción -->
    <div>
      <h3 class="text-lg font-bold mb-2 text-vaporwave4">Lista de Reproducción ({{ store.state.playlist.length }})</h3>
      <div v-if="loading" class="text-center py-4 text-white">
        <p>Cargando música...</p>
      </div>
      <div v-else-if="!store.state.playlist.length" class="text-center py-4 text-white">
        <p>No hay música en la lista de reproducción</p>
        <button @click="openDirectoryPicker" class="mt-2 px-4 py-2 bg-vaporwave2 hover:bg-vaporwave4 text-white transition">
          Seleccionar carpeta de música
        </button>
      </div>
      <Playlist 
        v-else
        :tracks="store.state.playlist" 
        :current-track="store.state.currentTrack"
        @favorite="handleFavorite"
        @remove="handleRemoveTrack"
      />
    </div>
    
    <!-- Mensajes de error -->
    <div v-if="error" class="bg-red-500/20 border border-red-500 p-3 text-white text-sm">
      {{ error }}
    </div>
    
    <!-- Mensajes de estado -->
    <div v-if="restoring" class="bg-vaporwave2/20 border border-vaporwave2 p-3 text-white text-sm">
      Restaurando último directorio de música...
    </div>

    <!-- Modal para añadir a playlist -->
    <div v-if="showAddToPlaylistModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div class="bg-vaporwave5 border-2 border-vaporwave4 p-4 w-full max-w-md">
        <div class="flex justify-between mb-4">
          <h3 class="text-lg font-bold text-vaporwave2">Añadir a lista de reproducción</h3>
          <button @click="showAddToPlaylistModal = false" class="text-lg text-vaporwave4 hover:text-vaporwave1">×</button>
        </div>
        
        <div v-if="userPlaylists.length > 0">
          <div class="max-h-64 overflow-y-auto mb-4 custom-scrollbar-vaporwave">
            <div 
              v-for="playlist in userPlaylists" 
              :key="playlist.id"
              @click="addCurrentTrackToPlaylist(playlist.id)"
              class="p-2 mb-1 bg-vaporwave3/50 hover:bg-vaporwave3 cursor-pointer"
            >
              <div class="flex justify-between">
                <div class="text-white font-medium">{{ playlist.name }}</div>
                <div class="text-vaporwave1 text-sm">{{ playlist.tracks.length }} pistas</div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="mb-4 text-center text-vaporwave1 p-4">
          No hay listas de reproducción. Crea una nueva.
        </div>
        
        <div class="flex items-center gap-2">
          <input 
            v-model="newPlaylistName" 
            type="text" 
            placeholder="Nombre de nueva lista..." 
            class="flex-grow bg-vaporwave3 text-white px-2 py-1 border border-vaporwave4/40"
            @keyup.enter="createAndAddToPlaylist"
          />
          <button 
            @click="createAndAddToPlaylist"
            class="bg-vaporwave2 hover:bg-vaporwave4 text-white px-3 py-1 transition"
            :disabled="!newPlaylistName.trim()"
          >
            Crear y añadir
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import Playlist from '../components/Playlist.vue';
import { usePlayerStore } from '../utils/playerStore';
import audioManager from '../utils/audioManager';
import { saveDirectoryHandle, getDirectoryHandle, clearDirectoryHandle } from '../utils/playlistManager.js';
import { getAllPlaylists, createPlaylist, addTrackToPlaylist } from '../utils/playlistManager';

const store = usePlayerStore();

// Estado
const loading = ref(false);
const error = ref('');
const restoring = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const showAddToPlaylistModal = ref(false);
const userPlaylists = ref([]);
const newPlaylistName = ref('');

// Computadas
const currentAlbumCover = computed(() => store.state.currentTrack?.coverUrl || null);

// Actualizar tiempo
audioManager.onTimeUpdate(() => {
  currentTime.value = audioManager.getCurrentTime();
});

// Actualizar duración cuando cambia la pista
audioManager.onEnded(() => {
  store.playNext();
});

// Formatear tiempo en formato mm:ss
function formatTime(seconds) {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Manejar cambio en barra de progreso
function handleSeek(event) {
  const time = parseFloat(event.target.value);
  audioManager.seekTo(time);
  currentTime.value = time;
}

// Manejar favorito
function handleFavorite(track) {
  store.toggleFavorite(track);
}

// Manejar eliminación de pista
function handleRemoveTrack(trackId) {
  // Por ahora solo eliminamos de la lista, no del dispositivo
  const newPlaylist = store.state.playlist.filter(track => track.id !== trackId);
  store.setPlaylist(newPlaylist);
}

// Abrir selector de directorio
async function openDirectoryPicker() {
  try {
    loading.value = true;
    error.value = '';
    
    // Verificar si la API está disponible
    if (!window.showDirectoryPicker) {
      error.value = 'Tu navegador no soporta la selección de directorios. Por favor usa Chrome, Edge o un navegador compatible.';
      loading.value = false;
      return;
    }
    
    // Abrir selector de directorio
    const dirHandle = await window.showDirectoryPicker({
      mode: 'read',
      startIn: 'music',
      id: 'music-folder'
    });
    
    // Guardar directorio seleccionado para próximas visitas
    await saveDirectoryHandle(dirHandle);
    
    // Escanear directorio
    await scanDirectory(dirHandle);
    
    loading.value = false;
  } catch (e) {
    // Si el usuario cancela, no mostrar error
    if (e.name === 'AbortError') {
      loading.value = false;
      return;
    }
    
    console.error('Error al seleccionar directorio:', e);
    error.value = `Error al acceder al directorio: ${e.message}`;
    loading.value = false;
  }
}

// Escanear directorio
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
    
    // Contar archivos de audio
    let totalAudio = 0;
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const ext = entry.name.split('.').pop().toLowerCase();
        if (["mp3","ogg","wav","flac"].includes(ext)) totalAudio++;
      }
    }
    
    // Procesar archivos de audio
    let processed = 0;
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const ext = entry.name.split('.').pop().toLowerCase();
        if (["mp3","ogg","wav","flac"].includes(ext)) {
          const base = entry.name.replace(/\.[^.]+$/, '');
          let coverUrl = null;
          let lyrics = '';
          let meta = { name: entry.name };
          
          // Buscar letras asociadas
          if (lyricsFiles[base]) {
            const file = await lyricsFiles[base].getFile();
            lyrics = await file.text();
          }
          
          // Obtener el archivo de audio
          const file = await entry.getFile();
          
          try {
            // Leer metadatos con jsmediatags
            await new Promise(resolve => {
              jsmediatags.read(file, {
                onSuccess: tag => {
                  meta = {
                    name: tag.tags.title || entry.name,
                    artist: tag.tags.artist || '',
                    album: tag.tags.album || '',
                    year: tag.tags.year || '',
                    genre: tag.tags.genre || '',
                    duration: '',
                  };
                  // Si hay imagen en los metadatos
                  if (tag.tags.picture) {
                    const { data, format } = tag.tags.picture;
                    const byteArray = new Uint8Array(data);
                    coverUrl = URL.createObjectURL(new Blob([byteArray], { type: `image/${format}` }));
                  }
                  resolve();
                },
                onError: error => {
                  console.warn('Error al leer metadatos:', error);
                  resolve();
                },
              });
            });
          } catch (err) {
            console.warn('Error al procesar metadatos:', err);
          }
          
          // Si no hay cover en metadatos, buscar archivos de imagen asociados
          if (!coverUrl && covers[base]) {
            const coverFile = await covers[base].getFile();
            coverUrl = URL.createObjectURL(coverFile);
          }
          
          // Añadir a la lista de reproducción
          tracks.push({
            id: crypto.randomUUID(),
            name: meta.name,
            artist: meta.artist,
            album: meta.album,
            year: meta.year,
            genre: meta.genre,
            duration: meta.duration,
            fileHandle: entry,
            favorite: false,
            coverUrl,
            lyrics
          });
          
          processed++;
        }
      }
    }
    
    // Actualizar lista de reproducción
    store.setPlaylist(tracks);
    
    // Seleccionar primera pista si hay pistas
    if (tracks.length) {
      store.setTrack(tracks[0]);
    }
    
    return tracks;
  } catch (e) {
    console.error('Error al escanear directorio:', e);
    error.value = `Error al escanear directorio: ${e.message}`;
    await clearDirectoryHandle();
    return [];
  }
}

// Carga las listas de reproducción del usuario
function loadUserPlaylists() {
  userPlaylists.value = getAllPlaylists();
}

// Añadir la pista actual a una lista de reproducción
function addCurrentTrackToPlaylist(playlistId) {
  if (!store.state.currentTrack) return;
  
  const success = addTrackToPlaylist(store.state.currentTrack, playlistId);
  
  if (success) {
    showAddToPlaylistModal.value = false;
    alert(`Pista añadida a la lista de reproducción`);
  } else {
    alert('Esta pista ya existe en la lista de reproducción');
  }
}

// Crear una nueva lista y añadir la pista actual
function createAndAddToPlaylist() {
  const name = newPlaylistName.value.trim();
  if (!name || !store.state.currentTrack) return;
  
  const newPlaylist = createPlaylist(name);
  if (newPlaylist) {
    addTrackToPlaylist(store.state.currentTrack, newPlaylist.id);
    newPlaylistName.value = '';
    showAddToPlaylistModal.value = false;
    alert(`Pista añadida a la nueva lista "${name}"`);
  }
}

// Al montar el componente, intentar restaurar el último directorio
onMounted(async () => {
  restoring.value = true;
  error.value = '';
  
  // Intentar restaurar el último directorio
  const lastHandle = await getDirectoryHandle();
  if (lastHandle) {
    try {
      const perm = await lastHandle.requestPermission({ mode: 'read' });
      if (perm === 'granted') {
        await scanDirectory(lastHandle);
      } else {
        error.value = 'Permiso denegado para acceder al directorio anterior.';
      }
    } catch (e) {
      error.value = 'No se pudo acceder al directorio anterior. Selecciona uno nuevo.';
    }
  }
  
  restoring.value = false;
});

// Cargar listas de reproducción y actualizar cuando se abre el modal
watch(showAddToPlaylistModal, (isOpen) => {
  if (isOpen) {
    loadUserPlaylists();
  }
});

// Escuchar el evento de cambio de duración
onMounted(() => {
  // Configurar listener para la duración del audio
  const audioElement = document.querySelector('audio');
  if (audioElement) {
    audioElement.addEventListener('durationchange', (event) => {
      if (event.detail && event.detail.duration) {
        duration.value = event.detail.duration;
      } else {
        duration.value = audioElement.duration || 0;
      }
    });
  }
  
  // Mantener una referencia al tiempo actual cuando se está reproduciendo
  const updateDuration = () => {
    if (store.state.currentTrack && store.state.isPlaying) {
      duration.value = audioManager.getDuration();
    }
  };
  
  // Actualizar cada segundo
  const durInterval = setInterval(updateDuration, 1000);
  
  // Limpiar intervalo cuando el componente se destruye
  onUnmounted(() => {
    clearInterval(durInterval);
  });
});

// Sincronizar tiempo actual con el store y el audio
function updateCurrentTimeFromStore() {
  currentTime.value = store.state.currentTime;
  // También actualizar duration por si cambió
  if (store.state.duration > 0) {
    duration.value = store.state.duration;
  }
}

// Crear un intervalo para actualización continua del UI
onMounted(() => {
  // Escuchar cambios en el tiempo desde el store
  watch(() => store.state.currentTime, () => {
    updateCurrentTimeFromStore();
  });

  // Escuchar cambios en la duración desde el store
  watch(() => store.state.duration, () => {
    duration.value = store.state.duration;
  });

  // Inicializar con valores actuales
  updateCurrentTimeFromStore();

  // Configurar listener para la duración del audio directamente
  const audioElement = document.querySelector('audio');
  if (audioElement) {
    audioElement.addEventListener('durationchange', () => {
      duration.value = audioElement.duration || 0;
      store.updateDuration(duration.value);
    });

    // También escuchar eventos de tiempo directamente del elemento de audio
    audioElement.addEventListener('timeupdate', () => {
      currentTime.value = audioElement.currentTime;
    });
  }

  // Actualizar UI para mayor fluidez, especialmente para el slider
  const updateInterval = setInterval(() => {
    if (store.state.isPlaying) {
      updateCurrentTimeFromStore();
    }
  }, 100); // Actualización más frecuente para mayor fluidez

  // Limpiar intervalo cuando el componente se destruye
  onUnmounted(() => {
    clearInterval(updateInterval);
  });
});
</script>

<style scoped>
.custom-scrollbar-vaporwave::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar-vaporwave::-webkit-scrollbar-track {
  background: var(--color-vaporwave3);
}

.custom-scrollbar-vaporwave::-webkit-scrollbar-thumb {
  background-color: var(--color-vaporwave4);
  border-radius: 0;
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

.portada {
  object-fit: cover;
  transition: transform 0.3s ease;
}

.portada:hover {
  transform: scale(1.05);
}
</style>
