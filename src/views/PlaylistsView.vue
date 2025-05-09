<template>
  <div class="p-3">
    <h1 class="text-2xl font-bold text-vaporwave4 mb-3">Listas de reproducción</h1>
    
    <!-- Navegación por pestañas -->
    <div class="mb-4 bg-vaporwave3 border-b border-vaporwave5">
      <div class="flex">
        <button 
          v-for="tab in tabs" 
          :key="tab.name"
          @click="activeTab = tab.name"
          :class="[
            'px-4 py-2 text-sm focus:outline-none',
            activeTab === tab.name 
              ? 'bg-vaporwave5 text-white font-medium border-t-2 border-vaporwave2' 
              : 'text-vaporwave4 hover:bg-vaporwave3/80'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
    
    <!-- Contenido de la pestaña activa -->
    
    <!-- Favoritos -->
    <div v-if="activeTab === 'favorites'" class="tab-content">
      <div v-if="store.state.favorites.length > 0">
        <Playlist 
          :tracks="store.state.favorites" 
          :current-track="store.state.currentTrack"
          @favorite="toggleFavorite"
          @remove="removeFavorite"
        />
      </div>
      <div v-else class="text-center py-8 bg-vaporwave3/50 border border-vaporwave5/40">
        <p class="text-vaporwave4 mb-2">No hay canciones favoritas</p>
        <p class="text-sm text-vaporwave1">Marca canciones como favoritas para verlas aquí</p>
      </div>
    </div>
    
    <!-- Lista actual -->
    <div v-if="activeTab === 'current'" class="tab-content">
      <div class="flex justify-between mb-4">
        <h2 class="text-lg font-medium text-vaporwave1">Lista actual</h2>
        <div>
          <button @click="clearPlaylist" class="px-3 py-1 text-sm bg-vaporwave2 text-white hover:opacity-90">
            Limpiar playlist
          </button>
        </div>
      </div>
      
      <div v-if="store.state.playlist.length > 0">
        <Playlist 
          :tracks="store.state.playlist" 
          :current-track="store.state.currentTrack"
          @favorite="toggleFavorite"
          @remove="removeFromPlaylist"
        />
      </div>
      <div v-else class="text-center py-8 bg-vaporwave3/50 border border-vaporwave5/40">
        <p class="text-vaporwave4 mb-2">No hay canciones en la lista actual</p>
        <button 
          @click="selectDirectory"
          class="px-4 py-2 mt-3 bg-vaporwave5 text-white hover:bg-vaporwave5/80"
        >
          Seleccionar carpeta de música
        </button>
      </div>
    </div>
    
    <!-- Directorio -->
    <div v-if="activeTab === 'directory'" class="tab-content">
      <div class="flex flex-col gap-3 mb-4">
        <button 
          @click="selectDirectory"
          class="w-full px-4 py-2 bg-vaporwave2 text-white hover:opacity-90"
        >
          Seleccionar carpeta de música
        </button>
        
        <div v-if="restoring" class="text-center p-3 bg-vaporwave3/50 border border-vaporwave5 text-white">
          <p>Restaurando último directorio...</p>
        </div>
        
        <div v-if="restoreError" class="text-center p-3 bg-red-500/30 border border-red-500 text-white">
          <p>{{ restoreError }}</p>
        </div>
      </div>
    </div>
    
    <!-- Playlists -->
    <div v-if="activeTab === 'playlists'" class="tab-content">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-medium text-vaporwave1">Mis listas</h2>
        
        <div class="flex items-center gap-2">
          <input 
            v-model="newPlaylistName"
            type="text"
            placeholder="Nombre de nueva lista..."
            class="px-2 py-1 bg-vaporwave3 border border-vaporwave5/70 text-white text-sm"
            @keyup.enter="createNewPlaylist"
          />
          <button 
            @click="createNewPlaylist"
            class="px-3 py-1 text-sm bg-vaporwave5 text-white hover:opacity-90"
            :disabled="!newPlaylistName.trim()"
          >
            Crear
          </button>
        </div>
      </div>
      
      <div v-if="playlists.length > 0" class="space-y-4">
        <div v-for="playlist in playlists" :key="playlist.id" class="bg-vaporwave3/70 border border-vaporwave5/40">
          <!-- Cabecera de playlist -->
          <div class="flex items-center justify-between p-3 border-b border-vaporwave5/40">
            <div>
              <h3 class="font-medium text-white">{{ playlist.name }}</h3>
              <p class="text-xs text-vaporwave1">{{ playlist.tracks.length }} pistas</p>
            </div>
            
            <div class="flex gap-2">
              <button 
                @click="playPlaylist(playlist)" 
                class="px-2 py-1 text-xs bg-vaporwave2 text-white"
                :disabled="!playlist.tracks.length"
              >
                Reproducir
              </button>
              <button 
                @click="removePlaylistItem(playlist.id)" 
                class="px-2 py-1 text-xs bg-vaporwave5/70 text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
          
          <!-- Pistas de la playlist -->
          <div v-if="playlist.tracks.length > 0" class="max-h-64 overflow-y-auto">
            <ul class="divide-y divide-vaporwave5/30">
              <li 
                v-for="track in playlist.tracks" 
                :key="track.id"
                class="flex items-center justify-between py-2 px-3 hover:bg-vaporwave3/90"
              >
                <div class="flex items-center gap-2 flex-grow min-w-0">
                  <!-- Mini cover -->
                  <div v-if="track.coverUrl" class="w-8 h-8 flex-shrink-0">
                    <img :src="track.coverUrl" alt="Cover" class="list-cover w-full object-cover" />
                  </div>
                  <div v-else class="w-8 h-8 flex-shrink-0 bg-vaporwave5/20 flex items-center justify-center">
                    🎵
                  </div>
                  
                  <!-- Info de la pista -->
                  <div class="overflow-hidden">
                    <div class="text-sm text-white truncate">{{ track.name }}</div>
                    <div class="text-xs text-vaporwave1 truncate">{{ track.artist || 'Desconocido' }}</div>
                  </div>
                </div>
                
                <!-- Acciones -->
                <div class="flex items-center gap-1">
                  <button @click="playTrack(track, playlist)" class="text-lg text-vaporwave4">▶️</button>
                  <button @click="removeTrackFromPlaylistItem(track.id, playlist.id)" class="text-lg text-vaporwave1">❌</button>
                </div>
              </li>
            </ul>
          </div>
          
          <div v-else class="p-4 text-center text-vaporwave1 text-sm">
            Esta lista de reproducción está vacía
          </div>
        </div>
      </div>
      
      <div v-else class="text-center py-8 bg-vaporwave3/50 border border-vaporwave5/40">
        <p class="text-vaporwave4 mb-2">No hay listas de reproducción</p>
        <p class="text-sm text-vaporwave1">Crea una nueva lista para organizar tu música</p>
      </div>
      
      <div class="mt-4">
        <button 
          @click="loadPlaylistFile"
          class="w-full px-4 py-2 bg-vaporwave5/80 text-white hover:bg-vaporwave5"
        >
          Cargar archivo de playlist
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { usePlayerStore } from '../utils/playerStore.js';
import Playlist from '../components/Playlist.vue';
import { getDirectoryHandle, saveDirectoryHandle, clearDirectoryHandle } from '../utils/playlistManager.js';
import { parsePlaylistFile, getAllPlaylists, createPlaylist, removePlaylist, removeTrackFromPlaylist, addTrackToPlaylist } from '../utils/playlistManager';
import audioManager from '../utils/audioManager';

const store = usePlayerStore();
const tabs = [
  { name: 'favorites', label: 'Favoritos' },
  { name: 'current', label: 'Lista actual' },
  { name: 'directory', label: 'Directorio' },
  { name: 'playlists', label: 'Listas de reproducción' },
];
const activeTab = ref('favorites');
const restoring = ref(false);
const restoreError = ref('');
const playlists = ref([]);
const newPlaylistName = ref('');

// Persistencia de playlist en localStorage
const PLAYLIST_KEY = 'pwa-musicplayer-playlist-v1';

function savePlaylistToStorage(list) {
  try {
    localStorage.setItem(PLAYLIST_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error al guardar playlist:', e);
  }
}

function loadPlaylistFromStorage() {
  try {
    const data = localStorage.getItem(PLAYLIST_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error al cargar playlist:', e);
  }
  return [];
}

// Acciones de gestión de playlist
function toggleFavorite(track) {
  store.toggleFavorite(track);
}

function removeFavorite(trackId) {
  // Eliminar de favoritos
  const updatedFavorites = store.state.favorites.filter(track => track.id !== trackId);
  store.state.favorites = updatedFavorites;
  
  // Actualizar marca de favorito en playlist
  const index = store.state.playlist.findIndex(track => track.id === trackId);
  if (index !== -1) {
    store.state.playlist[index].favorite = false;
  }
  
  // Actualizar en localStorage
  try {
    localStorage.setItem('pwa-musicplayer-favorites', JSON.stringify(updatedFavorites));
  } catch (e) {
    console.error('Error al guardar favoritos:', e);
  }
}

function removeFromPlaylist(trackId) {
  const newPlaylist = store.state.playlist.filter(track => track.id !== trackId);
  store.setPlaylist(newPlaylist);
}

function clearPlaylist() {
  if (confirm('¿Estás seguro de que quieres limpiar la lista de reproducción?')) {
    store.setPlaylist([]);
    store.setTrack(null);
  }
}

async function loadPlaylistFile() {
  try {
    // Implementación en una versión futura
    alert('Función en desarrollo');
  } catch (e) {
    console.error('Error al cargar archivo de playlist:', e);
  }
}

async function selectDirectory() {
  try {
    restoreError.value = '';
    // Verificar si la API está disponible
    if (!window.showDirectoryPicker) {
      restoreError.value = 'Tu navegador no soporta la selección de directorios.';
      return;
    }
    
    // Abrir selector de directorio
    const dirHandle = await window.showDirectoryPicker({
      mode: 'read',
      startIn: 'music'
    });
    
    // Guardar referencia al directorio
    await saveDirectoryHandle(dirHandle);
    
    // Escanear directorio
    await scanDirectory(dirHandle);
    
  } catch (e) {
    if (e.name !== 'AbortError') {
      console.error('Error al seleccionar directorio:', e);
      restoreError.value = `Error al acceder al directorio: ${e.message}`;
    }
  }
}

async function scanDirectory(dirHandle) {
  try {
    const jsmediatags = window.jsmediatags;
    const tracks = [];
    const covers = {};
    const lyricsFiles = {};
    
    // Fase 1: Indexar archivos por tipo
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const ext = entry.name.split('.').pop().toLowerCase();
        if (["jpg","jpeg","png"].includes(ext)) {
          covers[entry.name.replace(/\.[^.]+$/, '')] = entry;
        } else if (["lrc","txt"].includes(ext)) {
          lyricsFiles[entry.name.replace(/\.[^.]+$/, '')] = entry;
        }
      }
    }
    
    // Fase 2: Procesar archivos de audio
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const ext = entry.name.split('.').pop().toLowerCase();
        if (["mp3","ogg","wav","flac"].includes(ext)) {
          const base = entry.name.replace(/\.[^.]+$/, '');
          let coverUrl = null;
          let lyrics = '';
          let meta = { name: entry.name };
          
          // Obtener letras asociadas
          if (lyricsFiles[base]) {
            const file = await lyricsFiles[base].getFile();
            lyrics = await file.text();
          }
          
          // Obtener metadatos
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
          
          // Usar carátula de archivo externo si existe
          if (!coverUrl && covers[base]) {
            const coverFile = await covers[base].getFile();
            coverUrl = URL.createObjectURL(coverFile);
          }
          
          // Añadir a la lista
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
        }
      }
    }
    
    store.setPlaylist(tracks);
    if (tracks.length) store.setTrack(tracks[0]);
    return tracks;
  } catch (e) {
    console.error('Error al escanear directorio:', e);
    restoreError.value = 'Error al escanear directorio. Intenta de nuevo.';
    return [];
  }
}

// Cargar listas de reproducción
function loadPlaylists() {
  playlists.value = getAllPlaylists();
}

// Crear nueva playlist
function createNewPlaylist() {
  const name = newPlaylistName.value.trim();
  if (!name) return;
  
  const newPlaylist = createPlaylist(name);
  if (newPlaylist) {
    loadPlaylists();
    newPlaylistName.value = '';
  }
}

// Eliminar una playlist
function removePlaylistItem(playlistId) {
  if (confirm('¿Estás seguro de querer eliminar esta lista de reproducción?')) {
    removePlaylist(playlistId);
    loadPlaylists();
  }
}

// Reproducir una playlist completa
function playPlaylist(playlist) {
  if (playlist.tracks.length > 0) {
    store.setPlaylist(playlist.tracks);
    store.setTrack(playlist.tracks[0]);
    audioManager.playFile(playlist.tracks[0].fileHandle);
    store.setPlaying(true);
  }
}

// Reproducir una canción específica
async function playTrack(track, playlist) {
  if (track.fileHandle) {
    await audioManager.playFile(track.fileHandle);
    store.setTrack(track);
    store.setPlaying(true);
  }
}

// Eliminar una canción de la playlist
function removeTrackFromPlaylistItem(trackId, playlistId) {
  removeTrackFromPlaylist(trackId, playlistId);
  loadPlaylists();
}

// Calcular duración total de una playlist
function calculateTotalDuration(tracks) {
  const totalSeconds = tracks.reduce((total, track) => {
    return total + (track.duration || 0);
  }, 0);
  
  if (totalSeconds <= 0) return '00:00';
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Inicialización
onMounted(async () => {
  loadPlaylists();
  
  const stored = loadPlaylistFromStorage();
  if (stored && stored.length) {
    store.setPlaylist(stored);
  }
});

// Guardar playlist cada vez que cambia
watch(() => store.state.playlist, (list) => {
  savePlaylistToStorage(list);
}, { deep: true });

</script>

<style scoped>
.tab-content {
  min-height: 200px;
}

:deep(.custom-scrollbar-vaporwave::-webkit-scrollbar) {
  width: 6px;
}

:deep(.custom-scrollbar-vaporwave::-webkit-scrollbar-track) {
  background: var(--color-vaporwave3);
}

:deep(.custom-scrollbar-vaporwave::-webkit-scrollbar-thumb) {
  background-color: var(--color-vaporwave5);
  border-radius: 0;
}
</style>
