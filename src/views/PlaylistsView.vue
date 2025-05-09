<template>
  <div class="playlists-view">
    <h2>Listas de Reproducción</h2>
    
    <div class="playlists-controls">
      <button @click="showNewPlaylistDialog = true" class="create-button">
        <span>+</span> Nueva Lista
      </button>
      <button @click="importPlaylist" class="import-button">Importar</button>
    </div>
    
    <div v-if="playlists.length === 0" class="empty-state">
      <p>No tienes ninguna lista de reproducción</p>
      <p class="hint">Crea una nueva lista o importa una existente</p>
    </div>
    
    <div v-else class="playlists-container">
      <div 
        v-for="playlist in playlists" 
        :key="playlist.id" 
        class="playlist-card"
        @click="selectPlaylist(playlist)"
      >
        <div class="playlist-cover">
          <img v-if="playlist.coverUrl" :src="playlist.coverUrl" alt="" />
          <div v-else class="cover-placeholder">
            <span>{{ playlist.name.charAt(0) }}</span>
          </div>
        </div>
        <div class="playlist-details">
          <h3>{{ playlist.name }}</h3>
          <p>{{ playlist.tracks.length }} pistas</p>
        </div>
      </div>
    </div>
    
    <!-- Dialog para crear nueva playlist -->
    <div v-if="showNewPlaylistDialog" class="modal-overlay">
      <div class="modal-content">
        <h3>Nueva Lista de Reproducción</h3>
        <input
          v-model="newPlaylistName"
          type="text"
          placeholder="Nombre de la lista"
          class="playlist-input"
          ref="playlistNameInput"
        />
        <div class="modal-actions">
          <button @click="showNewPlaylistDialog = false" class="cancel-button">Cancelar</button>
          <button @click="createPlaylist" class="confirm-button">Crear</button>
        </div>
      </div>
    </div>
    
    <!-- Detalle de la playlist seleccionada -->
    <div v-if="selectedPlaylist" class="playlist-detail">
      <div class="playlist-header">
        <h3>{{ selectedPlaylist.name }}</h3>
        <div class="playlist-actions">
          <button @click="exportPlaylist(selectedPlaylist)">Exportar</button>
          <button @click="deletePlaylist(selectedPlaylist)" class="delete-button">Eliminar</button>
          <!-- Botón para limpiar las pistas de la playlist -->
          <button v-if="selectedPlaylist" @click="clearTracks" class="clear-button">Borrar pistas</button>
        </div>
      </div>
      
      <div class="tracks-list">
        <div v-if="selectedPlaylist.tracks.length === 0" class="empty-tracks">
          <p>Esta lista no tiene pistas</p>
        </div>
        <ul v-else>
          <li 
            v-for="(track, index) in selectedPlaylist.tracks" 
            :key="track.id"
            class="track-item"
          >
            <span class="track-number">{{ index + 1 }}</span>
            <div class="track-info">
              <div class="track-name">{{ track.name }}</div>
              <div class="track-artist">{{ track.artist || 'Desconocido' }}</div>
            </div>
            <button @click="removeTrackFromPlaylist(track)" class="remove-track">×</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlaylistsView',
  data() {
    return {
      playlists: [
        // Datos de ejemplo
        {
          id: '1',
          name: 'Favoritos',
          tracks: [
            { id: '101', name: 'Song 1', artist: 'Artist 1' },
            { id: '102', name: 'Song 2', artist: 'Artist 2' },
          ]
        },
        {
          id: '2',
          name: 'Rock',
          tracks: []
        }
      ],
      selectedPlaylist: null,
      showNewPlaylistDialog: false,
      newPlaylistName: ''
    }
  },
  methods: {
    selectPlaylist(playlist) {
      this.selectedPlaylist = playlist;
    },
    createPlaylist() {
      if (!this.newPlaylistName.trim()) {
        alert('Por favor ingresa un nombre para la lista de reproducción');
        return;
      }
      
      // Para implementar: Crear lista en el sistema de almacenamiento
      const newPlaylist = {
        id: Date.now().toString(),
        name: this.newPlaylistName,
        tracks: []
      };
      
      this.playlists.push(newPlaylist);
      this.newPlaylistName = '';
      this.showNewPlaylistDialog = false;
      this.selectedPlaylist = newPlaylist;
    },
    importPlaylist() {
      // Para implementar: Importación de listas
      alert('Función de importación a implementar');
    },
    exportPlaylist(playlist) {
      // Para implementar: Exportación de listas
      alert(`Exportando lista: ${playlist.name}`);
    },
    deletePlaylist(playlist) {
      if (confirm(`¿Estás seguro de querer eliminar la lista "${playlist.name}"?`)) {
        this.playlists = this.playlists.filter(p => p.id !== playlist.id);
        if (this.selectedPlaylist?.id === playlist.id) {
          this.selectedPlaylist = null;
        }
      }
    },
    removeTrackFromPlaylist(track) {
      if (this.selectedPlaylist) {
        this.selectedPlaylist.tracks = this.selectedPlaylist.tracks.filter(t => t.id !== track.id);
      }
    },
    clearTracks() {
      if (this.selectedPlaylist) {
        this.selectedPlaylist.tracks = [];
      }
    }
  },
  mounted() {
    // Para implementar: Cargar listas desde el almacenamiento
  },
  watch: {
    showNewPlaylistDialog(val) {
      if (val) {
        this.$nextTick(() => {
          this.$refs.playlistNameInput?.focus();
        });
      }
    }
  }
}
</script>

<style scoped>
.playlists-view {
  padding: var(--space-md);
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  margin-bottom: var(--space-lg);
  color: var(--color-vaporwave4);
}

h3 {
  margin: 0;
  color: var(--color-vaporwave1);
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

.create-button {
  background-color: var(--color-vaporwave1);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.create-button:hover {
  background-color: var(--color-vaporwave4);
}

.import-button {
  background-color: var(--color-vaporwave5);
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

.playlists-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.playlist-card {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.playlist-card:hover {
  transform: translateY(-3px);
  background-color: rgba(0, 0, 0, 0.3);
}

.playlist-cover {
  height: 160px;
  background-color: var(--color-vaporwave5);
  position: relative;
}

.playlist-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 3rem;
  color: rgba(255, 255, 255, 0.3);
}

.playlist-details {
  padding: var(--space-sm) var(--space-md);
}

.playlist-details p {
  margin: var(--space-xs) 0 0;
  color: var(--color-text-secondary);
  font-size: 0.9em;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--color-bg-dark);
  padding: var(--space-lg);
  border-radius: 8px;
  min-width: 300px;
}

.playlist-input {
  width: 100%;
  padding: var(--space-sm);
  margin: var(--space-md) 0;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--color-vaporwave5);
  color: white;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
}

.cancel-button {
  background-color: transparent;
  border: 1px solid var(--color-vaporwave5);
}

.confirm-button {
  background-color: var(--color-vaporwave1);
}

.playlist-detail {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: var(--space-md);
  margin-top: var(--space-lg);
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.playlist-actions {
  display: flex;
  gap: var(--space-sm);
}

.delete-button {
  background-color: rgba(255, 59, 48, 0.7);
}

.delete-button:hover {
  background-color: rgba(255, 59, 48, 0.9);
}

.tracks-list {
  margin-top: var(--space-md);
}

.empty-tracks {
  text-align: center;
  padding: var(--space-lg);
  color: var(--color-text-secondary);
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.track-item {
  display: flex;
  align-items: center;
  padding: var(--space-sm);
  border-radius: 4px;
  margin-bottom: var(--space-xs);
  background-color: rgba(0, 0, 0, 0.1);
}

.track-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.track-number {
  width: 30px;
  text-align: center;
  color: var(--color-text-secondary);
}

.track-info {
  flex: 1;
}

.track-artist {
  font-size: 0.9em;
  color: var(--color-text-secondary);
}

.remove-track {
  background-color: transparent;
  color: var(--color-text-secondary);
  font-size: 1.2rem;
  padding: 0 var(--space-sm);
  margin: 0;
}

.remove-track:hover {
  color: white;
  background-color: transparent;
}
</style>
