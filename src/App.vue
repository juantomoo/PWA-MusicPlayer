<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter, RouterView } from 'vue-router';
import Tabs from './components/Tabs.vue';
import PlayerControls from './components/PlayerControls.vue';
import TrackInfo from './components/TrackInfo.vue';
import VolumeControl from './components/VolumeControl.vue';
import DevTools from './components/DevTools.vue';
// import DeviceFeatures from './components/DeviceFeatures.vue';
import { usePlayerStore } from './utils/playerStore.js';
import audioManager from './utils/audioManager.js';
import { getDirectoryHandle, clearDirectoryHandle } from './utils/playlistManager.js';

const isDev = import.meta.env.DEV;
const router = useRouter();
const route = useRoute();

const tabs = [
  { name: 'NowPlaying', label: 'Reproduciendo', path: '/' },
  { name: 'Letras', label: 'Letras', path: '/letras' },
  { name: 'Equalizer', label: 'Ecualizador', path: '/equalizer' },
  { name: 'Playlists', label: 'Listas', path: '/playlists' },
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
    store.setPlaying(false);
  } else {
    audioManager.playFile(store.state.currentTrack.fileHandle);
    store.setPlaying(true);
  }
}

function handleVolume(val) {
  store.setVolume(val);
  audioManager.setVolume(val);
}

function handlePrev() {
  store.playPrev();
}

function handleNext() {
  store.playNext();
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
    // Contar archivos de audio
    let totalAudio = 0;
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const ext = entry.name.split('.').pop().toLowerCase();
        if (["mp3","ogg","wav"].includes(ext)) totalAudio++;
      }
    }
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
          processed++;
        }
      }
    }
    store.setPlaylist(tracks);
    if (tracks.length) store.setTrack(tracks[0]);
  } catch (e) {
    restoreError.value = 'No se pudo acceder al directorio. Selecciona uno nuevo.';
    await clearDirectoryHandle();
  }
}

onMounted(async () => {
  restoring.value = true;
  restoreError.value = '';
  // Intentar restaurar el último directorio
  const lastHandle = await getDirectoryHandle();
  if (lastHandle) {
    try {
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
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-vaporwave3 text-white">
    <header class="w-full flex items-center justify-between px-4 py-3 bg-vaporwave5 shadow">
      <div class="flex items-center gap-2">
        <img src="/icons/icon-192x192.png" alt="Logo" class="w-9 h-9 rounded" />
        <span class="text-xl font-bold tracking-wide">PWA Music Player</span>
      </div>
    </header>
    <Tabs :tabs="tabs" :model-value="route.name" @change="goToTab" />
    <main class="flex-1 flex flex-col w-full max-w-md mx-auto px-2 pb-28">
      <RouterView />
    </main>
    <footer class="fixed bottom-0 left-0 w-full bg-vaporwave5 shadow-lg z-20">
      <div class="flex flex-col items-center gap-1 py-2 px-2 max-w-md mx-auto">
        <TrackInfo :track="store.state.currentTrack || { name: 'Sin pista', artist: '', album: '', year: '' }" />
        <div class="flex items-center justify-between w-full gap-2 mt-1">
          <PlayerControls :is-playing="store.state.isPlaying" @prev="handlePrev" @togglePlay="handleTogglePlay" @next="handleNext" />
          <VolumeControl :model-value="store.state.volume" @update:modelValue="handleVolume" />
        </div>
      </div>
      <div class="text-center text-xs text-vaporwave4 pb-1">&copy; 2025 HISQUE Estudio</div>
    </footer>
    <DevTools v-if="isDev" />
  </div>
</template>

<style>
body {
  background: #552A93;
}
</style>
