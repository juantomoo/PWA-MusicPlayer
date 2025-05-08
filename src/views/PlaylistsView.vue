<template>
  <div class="flex flex-col items-center gap-4 p-4 w-full max-w-md mx-auto">
    <div class="w-full">
      <div class="flex w-full justify-around border-b border-vaporwave2 mb-2 sticky top-0 bg-vaporwave5 z-10">
        <button v-for="tab in tabs" :key="tab.name" @click="activeTab = tab.name"
          :class="['flex-1 py-2', activeTab === tab.name ? 'font-bold text-vaporwave2 border-b-2 border-vaporwave2' : 'text-vaporwave4']">
          {{ tab.label }}
        </button>
      </div>
    </div>
    <div class="w-full flex flex-wrap gap-2 justify-end mb-2">
      <button @click="selectDirectory" class="px-3 py-1 bg-vaporwave2 text-white rounded shadow hover:bg-vaporwave1 transition">
        Seleccionar carpeta de música
      </button>
      <button @click="clearPlaylist" class="px-3 py-1 bg-vaporwave5 text-vaporwave4 rounded shadow hover:bg-vaporwave2 hover:text-white transition">
        Limpiar playlist
      </button>
      <button @click="loadPlaylistFile" class="px-3 py-1 bg-vaporwave1 text-vaporwave3 rounded shadow hover:bg-vaporwave2 hover:text-white transition">
        Cargar archivo de playlist
      </button>
    </div>
    <div v-if="progress.show" class="w-full mb-4">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs text-vaporwave2 font-semibold">Cargando música...</span>
        <span class="text-xs text-vaporwave4">{{ progress.percent }}% ({{ progress.processed }}/{{ progress.total }})</span>
      </div>
      <div class="w-full bg-vaporwave4/30 rounded-full h-3 overflow-hidden">
        <div class="bg-vaporwave2 h-3 rounded-full transition-all duration-200" :style="`width: ${progress.percent}%`"></div>
      </div>
      <div class="flex justify-end text-xs text-vaporwave4 mt-1">
        <span v-if="progress.eta > 0">Tiempo estimado: {{ progress.eta }}s</span>
        <span v-else>Procesando...</span>
      </div>
    </div>
    <div v-if="activeTab === 'favorites'" class="w-full">
      <h2 class="font-bold text-vaporwave2 mb-2">Favoritos</h2>
      <Playlist :tracks="store.state.favorites" :current-track="store.state.currentTrack" @play="store.setTrack($event)" @favorite="store.toggleFavorite" />
      <div v-if="!store.state.favorites.length" class="text-vaporwave4 text-center mt-4">No hay favoritos aún.</div>
    </div>
    <div v-else-if="activeTab === 'current'" class="w-full">
      <h2 class="font-bold text-vaporwave2 mb-2">Lista actual</h2>
      <Playlist :tracks="store.state.playlist" :current-track="store.state.currentTrack" @play="store.setTrack($event)" @favorite="store.toggleFavorite" />
      <div v-if="!store.state.playlist.length" class="text-vaporwave4 text-center mt-4">La lista está vacía.</div>
    </div>
    <div v-else class="w-full">
      <h2 class="font-bold text-vaporwave2 mb-2">Listas del directorio</h2>
      <div class="text-vaporwave4 text-center mt-4">(Próximamente: integración con directorio)</div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref, watch } from 'vue';
import { usePlayerStore } from '../utils/playerStore.js';
import Playlist from '../components/Playlist.vue';
import { getDirectoryHandle, saveDirectoryHandle, clearDirectoryHandle } from '../utils/playlistManager.js';

const store = usePlayerStore();
const tabs = [
  { name: 'favorites', label: 'Favoritos' },
  { name: 'current', label: 'Lista actual' },
  { name: 'directory', label: 'Directorio' },
];
const activeTab = ref('favorites');
const progress = ref({
  show: false,
  percent: 0,
  processed: 0,
  total: 0,
  elapsed: 0,
  eta: 0,
  start: 0
});
const restoring = ref(false);
const restoreError = ref('');

// Persistencia de playlist en localStorage
const PLAYLIST_KEY = 'pwa-musicplayer-playlist-v1';

function savePlaylistToStorage(list) {
  try {
    localStorage.setItem(PLAYLIST_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('No se pudo guardar la playlist:', e);
  }
}

function loadPlaylistFromStorage() {
  try {
    const data = localStorage.getItem(PLAYLIST_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn('No se pudo cargar la playlist:', e);
  }
  return [];
}

onMounted(async () => {
  restoring.value = true;
  restoreError.value = '';
  // Intentar restaurar el último directorio
  const lastHandle = await getDirectoryHandle();
  if (lastHandle) {
    try {
      // Pedir permiso si es necesario
      const perm = await lastHandle.requestPermission({ mode: 'read' });
      if (perm === 'granted') {
        await scanDirectory(lastHandle);
        restoring.value = false;
        return;
      } else {
        restoreError.value = 'Permiso denegado para acceder al directorio anterior.';
      }
    } catch (e) {
      restoreError.value = 'No se pudo acceder al directorio anterior. Selecciona uno nuevo.';
    }
  }
  restoring.value = false;

  const stored = loadPlaylistFromStorage();
  if (stored && stored.length) {
    store.setPlaylist(stored);
    store.setTrack(stored[0]);
  }
});

// Guardar playlist cada vez que cambia
watch(() => store.state.playlist, (list) => {
  savePlaylistToStorage(list);
}, { deep: true });

function clearPlaylist() {
  store.setPlaylist([]);
  store.setTrack(null);
}

async function loadPlaylistFile() {
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        { description: 'Playlists', accept: { 'audio/x-mpegurl': ['.m3u'], 'audio/x-scpls': ['.pls'], 'application/json': ['.json'] } }
      ]
    });
    const file = await fileHandle.getFile();
    let tracks = [];
    if (file.name.endsWith('.m3u')) {
      const text = await file.text();
      tracks = text.split(/\r?\n/).filter(l => l && !l.startsWith('#')).map(name => ({ name, id: crypto.randomUUID() }));
    } else if (file.name.endsWith('.pls')) {
      const text = await file.text();
      tracks = text.split(/\r?\n/).filter(l.startsWith('File')).map(l => ({ name: l.split('=')[1], id: crypto.randomUUID() }));
    } else if (file.name.endsWith('.json')) {
      tracks = JSON.parse(await file.text());
    }
    if (tracks.length) {
      store.setPlaylist(tracks);
      store.setTrack(tracks[0]);
    }
  } catch (e) {
    alert('No se pudo cargar el archivo de playlist.');
  }
}

async function scanDirectory(dirHandle) {
  // Copia de selectDirectory, pero usando dirHandle recibido
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
        if (["mp3","ogg","wav"].includes(ext)) totalAudio++;
      }
    }
    progress.value = {
      show: true,
      percent: 0,
      processed: 0,
      total: totalAudio,
      elapsed: 0,
      eta: 0,
      start: Date.now()
    };
    let processed = 0;
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
                  console.warn('Error leyendo metadatos de', entry.name, error);
                  resolve();
                },
              });
            });
          } catch (err) {
            console.error('Error inesperado leyendo metadatos de', entry.name, err);
          }
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
          processed++;
          const elapsed = (Date.now() - progress.value.start) / 1000;
          const percent = Math.round((processed / totalAudio) * 100);
          const eta = processed > 0 ? Math.round((elapsed / processed) * (totalAudio - processed)) : 0;
          progress.value = {
            ...progress.value,
            percent,
            processed,
            elapsed,
            eta
          };
        }
      }
    }
    progress.value.show = false;
    store.setPlaylist(tracks);
    if (tracks.length) store.setTrack(tracks[0]);
  } catch (e) {
    progress.value.show = false;
    restoreError.value = 'No se pudo acceder al directorio. Selecciona uno nuevo.';
    await clearDirectoryHandle();
  }
}

async function selectDirectory() {
  try {
    const dirHandle = await window.showDirectoryPicker();
    await saveDirectoryHandle(dirHandle);
    await scanDirectory(dirHandle);
    restoreError.value = '';
  } catch (e) {
    restoreError.value = 'No se pudo acceder al directorio. Intenta de nuevo.';
  }
}
</script>
