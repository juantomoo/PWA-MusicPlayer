<template>
  <div class="now-playing">
    <h2>Reproduciendo ahora</h2>
    <div class="controls-header">
      <button @click="loadMusicLibrary" :disabled="loading">Seleccionar directorio de música</button>
      <button v-if="playlist.length" @click="clearPlaylist" class="clear-button">Borrar lista</button>
    </div>
    <div v-if="error" class="empty-state">
      <p>{{ error }}</p>
      <button @click="loadMusicLibrary" :disabled="loading">Seleccionar directorio de música</button>
    </div>
    <div v-else-if="!currentTrack" class="empty-state">
      <p>No hay pistas cargadas</p>
      <button @click="loadMusicLibrary" :disabled="loading">Seleccionar directorio de música</button>
    </div>
    <div v-else class="track-info">
      <div class="cover-container">
        <img v-if="currentTrack.coverUrl" :src="currentTrack.coverUrl" alt="Portada" class="cover" />
        <div v-else class="cover-placeholder">
          <span>Sin portada</span>
        </div>
      </div>
      <div class="track-details">
        <h3>{{ currentTrack.name }}</h3>
        <p class="artist">{{ currentTrack.artist || 'Artista desconocido' }}</p>
        <p class="album">{{ currentTrack.album || 'Álbum desconocido' }}</p>
      </div>
    </div>
    <div class="track-list">
      <h3>Lista de reproducción</h3>
      <div v-if="playlist.length === 0" class="empty-playlist">
        No hay pistas en la lista de reproducción
      </div>
      <ul v-else>
        <li 
          v-for="(track, index) in playlist" 
          :key="track.id"
          :class="{ active: currentTrack && currentTrack.id === track.id }"
          @click="playTrack(track)"
        >
          <span class="track-number">{{ index + 1 }}</span>
          <div class="track-info-mini">
            <div class="track-name">{{ track.name }}</div>
            <div class="track-artist">{{ track.artist || 'Desconocido' }}</div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import playerStore from '../store/playerStore';

export default {
  name: 'NowPlayingView',
  setup() {
    return {
      playlist: computed(() => playerStore.playlist),
      currentTrack: computed(() => playerStore.currentTrack),
      loading: computed(() => playerStore.loading),
      error: computed(() => playerStore.error),
      loadMusicLibrary: playerStore.loadMusicLibrary,
      clearPlaylist: playerStore.clearPlaylist,
      playTrack: playerStore.setTrack
    };
  }
};
</script>

<style scoped>
.now-playing {
  padding: var(--space-md);
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  margin-bottom: var(--space-lg);
  color: var(--color-vaporwave4);
}

.controls-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.empty-state {
  text-align: center;
  padding: var(--space-xl);
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: var(--space-lg);
}

.track-info {
  display: flex;
  margin-bottom: var(--space-lg);
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: var(--space-md);
}

.cover-container {
  width: 150px;
  height: 150px;
  flex-shrink: 0;
  margin-right: var(--space-md);
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-vaporwave5);
  color: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
}

.track-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.track-details h3 {
  margin: 0 0 var(--space-sm);
  color: var(--color-vaporwave4);
}

.artist, .album {
  margin: 0;
  color: var(--color-text-secondary);
}

.track-list {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: var(--space-md);
}

.track-list h3 {
  margin-top: 0;
  color: var(--color-vaporwave1);
}

.empty-playlist {
  text-align: center;
  padding: var(--space-lg);
  color: var(--color-text-secondary);
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  display: flex;
  align-items: center;
  padding: var(--space-sm);
  border-radius: 4px;
  margin-bottom: var(--space-xs);
  cursor: pointer;
  transition: background-color 0.2s;
}

li:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

li.active {
  background-color: var(--color-vaporwave2);
}

.track-number {
  width: 30px;
  text-align: center;
  margin-right: var(--space-sm);
  color: var(--color-text-secondary);
}

.track-info-mini {
  flex: 1;
}

.track-artist {
  font-size: 0.9em;
  color: var(--color-text-secondary);
}

button {
  background-color: var(--color-vaporwave1);
  color: var(--color-bg-dark);
  padding: var(--space-sm) var(--space-lg);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

button:hover {
  background-color: var(--color-vaporwave4);
}

.clear-button {
  background-color: var(--color-vaporwave3);
}

.clear-button:hover {
  background-color: var(--color-vaporwave5);
}
</style>
