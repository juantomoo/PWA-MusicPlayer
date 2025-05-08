import { reactive, readonly } from 'vue';
import audioManager from './audioManager.js';

const state = reactive({
  currentTrack: null, // { id, name, artist, album, year, ... }
  isPlaying: false,
  volume: 0.7,
  playlist: [], // array de tracks
  favorites: [], // array de tracks favoritos
});

function playNext() {
  const list = state.playlist;
  if (!state.currentTrack || !list.length) return;
  const idx = list.findIndex(t => t.id === state.currentTrack.id);
  if (idx !== -1 && idx < list.length - 1) {
    const next = list[idx + 1];
    state.currentTrack = next;
    audioManager.playFile(next.fileHandle, state.volume);
    state.isPlaying = true;
  }
}

function playPrev() {
  const list = state.playlist;
  if (!state.currentTrack || !list.length) return;
  const idx = list.findIndex(t => t.id === state.currentTrack.id);
  if (idx > 0) {
    const prev = list[idx - 1];
    state.currentTrack = prev;
    audioManager.playFile(prev.fileHandle, state.volume);
    state.isPlaying = true;
  }
}

export function usePlayerStore() {
  function setTrack(track) {
    state.currentTrack = track;
  }
  function setPlaying(val) {
    state.isPlaying = val;
  }
  function setVolume(val) {
    state.volume = val;
    audioManager.setVolume(val);
  }
  function setPlaylist(list) {
    state.playlist = list;
  }
  function setFavorites(list) {
    state.favorites = list;
  }
  function toggleFavorite(track) {
    const idx = state.favorites.findIndex(t => t.id === track.id);
    if (idx === -1) state.favorites.push(track);
    else state.favorites.splice(idx, 1);
  }
  return {
    state: readonly(state),
    setTrack,
    setPlaying,
    setVolume,
    setPlaylist,
    setFavorites,
    toggleFavorite,
    playNext,
    playPrev,
  };
}
