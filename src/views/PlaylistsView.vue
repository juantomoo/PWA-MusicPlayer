<template>
  <div class="playlists-view sombra-alt">
    <h2>Mi Música</h2>
    <div class="playlists-controls">
      <button @click="selectMusicDirectory" class="sombra">Seleccionar Directorio</button>
      <button @click="rescanDirectories" class="sombra">Reescanear Directorio</button>
      <button @click="clearPlaylist" class="sombra">Limpiar lista</button>
    </div>
    <div v-if="!playlist || playlist.tracks.length === 0" class="empty-state">
      <p>No tienes canciones cargadas</p>
      <p class="hint">Selecciona un directorio para cargar tu música</p>
    </div>
    <div v-else>
      <Playlist
        :tracks="playlist.tracks"
        :currentTrack="playerStore.currentTrack"
        @favorite="onFavorite"
        @remove="onRemove"
      />
    </div>
    <div v-if="isImporting" class="import-progress-overlay">
      <LoadingProgress
        :processed="importProgress.processed"
        :total="importProgress.total"
        :message="'Importando o reescaneando tu biblioteca de música...'"
        :showCounts="true"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import playlistManager from '../utils/playlistManager';
import { usePlayerStore } from '../store/playerStore';
import Playlist from '../components/Playlist.vue';
import LoadingProgress from '../components/LoadingProgress.vue';

const playerStore = usePlayerStore();
const playlist = ref(null);

// Estado para progreso de importación
const isImporting = ref(false);
const importProgress = ref({ processed: 0, total: 0 });

async function loadGlobalPlaylist() {
  playlist.value = await playlistManager.getGlobalPlaylist();
  if (playlist.value && playlist.value.tracks.length > 0) {
    playerStore.setGlobalPlaylist(playlist.value.tracks);
  }
}

onMounted(async () => {
  await loadGlobalPlaylist();
});

async function selectMusicDirectory() {
  isImporting.value = true;
  importProgress.value = { processed: 0, total: 0 };
  await playlistManager.selectAndScanMusicDirectory((progress) => {
    importProgress.value = progress;
  });
  isImporting.value = false;
  await loadGlobalPlaylist();
}

async function rescanDirectories() {
  isImporting.value = true;
  importProgress.value = { processed: 0, total: 0 };
  await playlistManager.selectAndScanMusicDirectory((progress) => {
    importProgress.value = progress;
  });
  isImporting.value = false;
  await loadGlobalPlaylist();
}

function clearPlaylist() {
  playlist.value = { id: `playlist_${Date.now()}`, name: 'Mi música', tracks: [] };
  playlistManager.savePlaylists([playlist.value]);
  playerStore.setGlobalPlaylist([]);
}

function onFavorite(track) {
  // Aquí puedes actualizar favoritos si lo deseas
}

function onRemove(trackId) {
  if (!playlist.value) return;
  playlist.value.tracks = playlist.value.tracks.filter(t => t.id !== trackId);
  playlistManager.savePlaylists();
  playerStore.setGlobalPlaylist(playlist.value.tracks);
}
</script>

<!-- <style scoped>
.playlists-controls {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}
.empty-state {
  text-align: center;
  padding: var(--space-xl);
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}
.hint {
  color: var(--color-text-secondary);
  font-size: 0.9em;
}
.import-progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.55);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style> -->
