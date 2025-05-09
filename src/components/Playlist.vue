<template>
  <div class="playlist-table-container">
    <div class="playlist-table-controls">
      <input v-model="filterText" type="text" placeholder="Filtrar canciones..." class="playlist-filter-input" />
    </div>
    <table class="playlist-table">
      <thead>
        <tr>
          <th @click="sortBy('name')">Título <span v-if="sortField==='name'">{{ sortOrder==='asc'?'▲':'▼' }}</span></th>
          <th @click="sortBy('artist')">Artista <span v-if="sortField==='artist'">{{ sortOrder==='asc'?'▲':'▼' }}</span></th>
          <th @click="sortBy('album')">Álbum <span v-if="sortField==='album'">{{ sortOrder==='asc'?'▲':'▼' }}</span></th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(track, idx) in filteredTracks" :key="track.id" :class="{active: isCurrentTrack(track)}" @click="playTrack(track)">
          <td>
            <div class="track-title-cell">
              <img v-if="track.coverArt" :src="track.coverArt" alt="Cover" class="track-cover-thumb" />
              <span>{{ track.name || 'Desconocido' }}</span>
            </div>
          </td>
          <td>{{ track.artist || 'Desconocido' }}</td>
          <td>{{ track.album || 'Desconocido' }}</td>
          <td>
            <button @click.stop="toggleFavorite(track)" :class="{fav: track.favorite}">
              <span v-if="track.favorite">❤️</span>
              <span v-else>🤍</span>
            </button>
            <button @click.stop="removeFromPlaylist(track)">❌</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="filteredTracks.length === 0" class="playlist-empty">No hay canciones para mostrar</div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { usePlayerStore } from '../store/playerStore';
import audioManager from '../utils/audioManager';
import favoritesManager from '../utils/favoritesManager';

const props = defineProps({
  tracks: { type: Array, required: true },
  currentTrack: { type: Object, default: null },
});
const emit = defineEmits(['favorite', 'remove']);
const playerStore = usePlayerStore();

const filterText = ref('');
const sortField = ref('name');
const sortOrder = ref('asc');

const filteredTracks = computed(() => {
  let result = [...props.tracks];
  if (filterText.value) {
    const term = filterText.value.toLowerCase();
    result = result.filter(track =>
      (track.name && track.name.toLowerCase().includes(term)) ||
      (track.artist && track.artist.toLowerCase().includes(term)) ||
      (track.album && track.album.toLowerCase().includes(term))
    );
  }
  result.sort((a, b) => {
    const aVal = a[sortField.value] || '';
    const bVal = b[sortField.value] || '';
    return sortOrder.value === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });
  return result;
});

function sortBy(field) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortOrder.value = 'asc';
  }
}

function isCurrentTrack(track) {
  return playerStore.currentTrack && playerStore.currentTrack.id === track.id;
}

async function playTrack(track) {
  // Actualizar el orden global de reproducción según el filtro/orden actual
  playerStore.setGlobalPlaylist(filteredTracks.value);
  playerStore.setCurrentTrack(track);
  try {
    await audioManager.playFile(track.fileHandle);
    playerStore.setPlayingState(true);
  } catch (error) {
    console.error('Error al reproducir pista:', error);
  }
}

async function toggleFavorite(track) {
  const updated = await favoritesManager.toggleFavorite(track);
  emit('favorite', { ...track, favorite: updated });
}

function removeFromPlaylist(track) {
  emit('remove', track.id);
}
</script>

<style scoped>
.playlist-table-container {
  width: 100%;
  background: var(--color-vaporwave3);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  padding: 0.5rem 0.5rem 1rem 0.5rem;
}
.playlist-table-controls {
  margin-bottom: 0.5rem;
}
.playlist-filter-input {
  width: 100%;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--color-vaporwave4);
  background: rgba(0,0,0,0.1);
  color: white;
}
.playlist-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
}
.playlist-table th {
  background: var(--color-vaporwave4);
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  user-select: none;
  font-size: 0.95em;
}
.playlist-table td {
  padding: 0.5rem;
  color: white;
  background: rgba(0,0,0,0.1);
}
.playlist-table tr.active {
  background: var(--color-vaporwave1);
  color: white;
}
.track-title-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.track-cover-thumb {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--color-vaporwave4);
}
button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1.1em;
  margin-right: 0.2em;
}
button.fav {
  color: var(--color-vaporwave2);
}
.playlist-empty {
  text-align: center;
  color: var(--color-vaporwave4);
  margin-top: 1rem;
}
</style>