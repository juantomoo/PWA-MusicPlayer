<template>
  <div class="playlists-view">
    <h2>Mi Música</h2>
    <div class="playlists-controls">
      <button @click="selectMusicDirectory" class="directory-button">Seleccionar Directorio</button>
      <button @click="rescanDirectories" class="rescan-button">Reescanear Directorio</button>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import playlistManager from '../utils/playlistManager';
import { usePlayerStore } from '../store/playerStore';
import Playlist from '../components/Playlist.vue';

const playerStore = usePlayerStore();
const playlist = ref(null);

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
  await playlistManager.selectAndScanMusicDirectory();
  await loadGlobalPlaylist();
}

async function rescanDirectories() {
  // Reutiliza la lógica de seleccionar directorio para forzar reescaneo
  await selectMusicDirectory();
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

<style scoped>
.playlists-view {
  padding: var(--space-md);
  max-width: 1200px;
  margin: 0 auto;
}
.playlists-controls {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}
button {
  padding: var(--space-sm) var(--space-md);
  background-color: var(--color-vaporwave5);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: var(--color-vaporwave1);
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
</style>
