<template>
  <div class="playlist-table-container" @scroll.passive="onScroll" ref="playlistContainer">
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
        <tr v-for="(track, idx) in visibleTracks" :key="track.id" :class="{active: isCurrentTrack(track)}" @click="playTrack(track)">
          <td>
            <div class="track-title-cell">
              <!-- Carátula eliminada para optimizar memoria -->
              <span>{{ track.name || 'Desconocido' }}</span>
            </div>
          </td>
          <td>{{ track.artist || 'Desconocido' }}</td>
          <td>{{ track.album || 'Desconocido' }}</td>
          <td>
            <button @click.stop="toggleFavorite(track)" :class="{fav: track.favorite}">
              <img v-if="track.favorite" src="/src/assets/favorite.svg" alt="Favorito" class="icon-svg" />
              <img v-else src="/src/assets/favorite.svg" alt="No favorito" class="icon-svg not-fav" />
            </button>
            <button @click.stop="removeFromPlaylist(track)">
              <img src="/src/assets/close.svg" alt="Eliminar" class="icon-svg" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="visibleTracks.length < filteredTracks.length" class="playlist-loadmore">Cargando más canciones...</div>
    <div v-if="filteredTracks.length === 0" class="playlist-empty">No hay canciones para mostrar</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { usePlayerStore } from '../store/playerStore';
import audioManager from '../utils/audioManager';
import favoritesManager from '../utils/favoritesManager';

const props = defineProps({
  tracks: { type: Array, required: true },
  currentTrack: { type: Object, default: null },
});
const emit = defineEmits(['favorite', 'remove']);
const playerStore = usePlayerStore();

const FILTER_KEY = 'playlist_filter';
const SORT_KEY = 'playlist_sort';
const PAGE_KEY = 'playlist_page';

const filterText = ref(localStorage.getItem(FILTER_KEY) || '');
const sortField = ref(localStorage.getItem(SORT_KEY + '_field') || 'name');
const sortOrder = ref(localStorage.getItem(SORT_KEY + '_order') || 'asc');
const pageSize = 40;
const page = ref(Number(localStorage.getItem(PAGE_KEY)) || 1);
const playlistContainer = ref(null);

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

const visibleTracks = computed(() => {
  return filteredTracks.value.slice(0, page.value * pageSize);
});

watch(filterText, (val) => {
  localStorage.setItem(FILTER_KEY, val);
  page.value = 1;
  localStorage.setItem(PAGE_KEY, '1');
});
watch(sortField, (val) => {
  localStorage.setItem(SORT_KEY + '_field', val);
});
watch(sortOrder, (val) => {
  localStorage.setItem(SORT_KEY + '_order', val);
});
watch(page, (val) => {
  localStorage.setItem(PAGE_KEY, String(val));
});
watch(filteredTracks, () => {
  playerStore.setGlobalPlaylist(filteredTracks.value);
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

function onScroll(e) {
  const el = playlistContainer.value;
  if (!el) return;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
    if (visibleTracks.value.length < filteredTracks.value.length) {
      page.value++;
    }
  }
}

onMounted(() => {
  // Restaura el filtro, orden y página al volver a la vista
  filterText.value = localStorage.getItem(FILTER_KEY) || '';
  sortField.value = localStorage.getItem(SORT_KEY + '_field') || 'name';
  sortOrder.value = localStorage.getItem(SORT_KEY + '_order') || 'asc';
  page.value = Number(localStorage.getItem(PAGE_KEY)) || 1;
});
</script>

<style scoped>
.playlist-table-container {
  width: 100%;
  background: var(--color-vaporwave3);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  padding: 0.5rem 0.5rem 1rem 0.5rem;
  max-height: 70vh;
  overflow-y: auto;
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
  color: var(--color-vaporwave4);
}
.playlist-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
}
.playlist-table th {
  background: var(--color-vaporwave5);
  color: var(--color-vaporwave4);
  cursor: pointer;
  padding: 0.5rem;
  user-select: none;
  font-size: 0.95em;
}
.playlist-table td {
  padding: 0.5rem;
  color: var(--color-vaporwave4);
  background: rgba(0,0,0,0.1);
}
.playlist-table tr.active {
  background: var(--color-vaporwave2);
  color: var(--color-vaporwave4);
}
.track-title-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
.icon-svg {
  width: 22px;
  height: 22px;
  vertical-align: middle;
  filter: drop-shadow(0 0 1px #552A93);
}
.icon-svg.not-fav {
  filter: grayscale(1) brightness(1.7) opacity(0.5);
}
.playlist-loadmore {
  text-align: center;
  color: var(--color-vaporwave4);
  margin: 1rem 0;
  font-size: 1em;
}
</style>