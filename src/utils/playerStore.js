import { reactive, readonly } from 'vue';
import { loadFavorites, saveFavorites, addFavorite, removeFavorite } from './favoritesManager';

const state = reactive({
  currentTrack: null,
  playlist: [],
  queue: [],
  history: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  progressPercentage: 0,
  volume: 0.8,
  repeat: 'off', // 'off', 'one', 'all'
  shuffle: false,
  favorites: loadFavorites(),
});

// Actualizar el tiempo actual y calcular el porcentaje de progreso
function updateCurrentTime(time) {
  state.currentTime = time;
  if (state.duration > 0) {
    state.progressPercentage = (time / state.duration) * 100;
  } else {
    state.progressPercentage = 0;
  }
}

// Actualizar la duración
function updateDuration(duration) {
  state.duration = duration;
  // Recalcular el porcentaje de progreso cuando cambia la duración
  if (state.currentTime > 0) {
    state.progressPercentage = (state.currentTime / duration) * 100;
  }
}

// Establecer pista actual
function setTrack(track) {
  if (!track) return;
  state.currentTrack = track;
  
  // Restablecer valores de reproducción
  state.currentTime = 0;
  state.progressPercentage = 0;
  
  // Asegurarse de que la pista muestre su estado favorito correcto
  if (state.favorites.some(fav => fav.id === track.id)) {
    state.currentTrack.favorite = true;
  }
}

// Establecer lista de reproducción
function setPlaylist(tracks) {
  state.playlist = tracks;
  
  // Actualizar estado favorito de las pistas
  state.playlist = state.playlist.map(track => {
    const isFavorite = state.favorites.some(fav => fav.id === track.id);
    return { ...track, favorite: isFavorite };
  });
}

// Reproducir
function play() {
  state.isPlaying = true;
}

// Pausar
function pause() {
  state.isPlaying = false;
}

// Reproducir siguiente pista
function playNext() {
  if (!state.playlist.length) return null;
  
  // Si no hay pista actual, reproducir la primera
  if (!state.currentTrack) {
    setTrack(state.playlist[0]);
    return state.currentTrack;
  }
  
  let nextIndex = -1;
  
  // Si hay cola, reproducir la primera pista de la cola
  if (state.queue.length) {
    const nextTrack = state.queue.shift();
    if (state.currentTrack) {
      state.history.push(state.currentTrack);
    }
    setTrack(nextTrack);
    return nextTrack;
  }
  
  // Si está en modo repetir uno, simplemente vuelve a reproducir la pista actual
  if (state.repeat === 'one') {
    return state.currentTrack;
  }
  
  // Si está en modo aleatorio, elegir una pista aleatoria
  if (state.shuffle) {
    const currentIndex = state.playlist.findIndex(track => track.id === state.currentTrack?.id);
    
    // Evitar seleccionar la misma pista
    do {
      nextIndex = Math.floor(Math.random() * state.playlist.length);
    } while (nextIndex === currentIndex && state.playlist.length > 1);
  } else {
    // Modo normal: siguiente pista
    const currentIndex = state.playlist.findIndex(track => track.id === state.currentTrack?.id);
    
    if (currentIndex >= 0) {
      nextIndex = currentIndex + 1;
      
      // Si llegamos al final y repeat está activado, volver al principio
      if (nextIndex >= state.playlist.length && state.repeat === 'all') {
        nextIndex = 0;
      }
    } else if (state.playlist.length > 0) {
      // Si no encontramos la pista actual, comenzar desde el principio
      nextIndex = 0;
    }
  }
  
  if (nextIndex >= 0 && nextIndex < state.playlist.length) {
    // Guardar pista actual en el historial
    if (state.currentTrack) {
      state.history.push(state.currentTrack);
    }
    
    setTrack(state.playlist[nextIndex]);
    return state.currentTrack;
  }
  
  return null;
}

// Reproducir pista anterior
function playPrev() {
  if (!state.playlist.length) return null;
  
  // Si hay historial, reproducir la última pista del historial
  if (state.history.length) {
    const prevTrack = state.history.pop();
    if (state.currentTrack) {
      state.queue.unshift(state.currentTrack);
    }
    setTrack(prevTrack);
    return prevTrack;
  }
  
  // Si no hay historial, ir a la pista anterior en la lista
  if (!state.currentTrack) {
    setTrack(state.playlist[0]);
    return state.currentTrack;
  }
  
  const currentIndex = state.playlist.findIndex(track => track.id === state.currentTrack?.id);
  if (currentIndex > 0) {
    setTrack(state.playlist[currentIndex - 1]);
    return state.currentTrack;
  } else if (state.repeat === 'all' && state.playlist.length > 0) {
    // Si está en modo repetir todo y estamos en la primera pista, ir a la última
    setTrack(state.playlist[state.playlist.length - 1]);
    return state.currentTrack;
  }
  
  return null;
}

// Cambiar volumen
function setVolume(volume) {
  state.volume = volume;
}

// Cambiar modo de repetición
function toggleRepeat() {
  switch (state.repeat) {
    case 'off':
      state.repeat = 'all';
      break;
    case 'all':
      state.repeat = 'one';
      break;
    case 'one':
    default:
      state.repeat = 'off';
      break;
  }
}

// Cambiar modo aleatorio
function toggleShuffle() {
  state.shuffle = !state.shuffle;
}

// Marcar/desmarcar pista como favorita
function toggleFavorite(track) {
  if (!track) return;
  
  const isFavorite = state.favorites.some(fav => fav.id === track.id);
  
  if (isFavorite) {
    // Quitar de favoritos
    state.favorites = removeFavorite(track.id, state.favorites);
    
    // Actualizar estado en playlist y currentTrack
    if (state.currentTrack?.id === track.id) {
      state.currentTrack.favorite = false;
    }
    
    state.playlist = state.playlist.map(t => 
      t.id === track.id ? { ...t, favorite: false } : t
    );
  } else {
    // Añadir a favoritos
    state.favorites = addFavorite(track, state.favorites);
    
    // Actualizar estado en playlist y currentTrack
    if (state.currentTrack?.id === track.id) {
      state.currentTrack.favorite = true;
    }
    
    state.playlist = state.playlist.map(t => 
      t.id === track.id ? { ...t, favorite: true } : t
    );
  }
}

// Crear un store compartido
export function usePlayerStore() {
  return {
    state: readonly(state),
    setTrack,
    setPlaylist,
    play,
    pause,
    playNext,
    playPrev,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    toggleFavorite,
    updateCurrentTime,
    updateDuration
  };
}
