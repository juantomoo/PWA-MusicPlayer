import { reactive } from 'vue';
import localforage from 'localforage';
import permissionsManager from '../utils/permissions';
import favoritesManager from '../utils/favoritesManager';
import audioManager from '../utils/audioManager';

// Configuración de localforage para el player
localforage.config({
  name: 'PWA Music Player',
  storeName: 'player_store'
});

// Estado inicial
const initialState = {
  currentTrack: null,
  playlist: [],
  isPlaying: false,
  volume: 0.7,
  currentTime: 0,
  duration: 0,
  repeat: 'off', // off, all, one
  shuffle: false,
  equalizer: {
    enabled: false,
    bands: [
      { frequency: 60, gain: 0 },
      { frequency: 250, gain: 0 },
      { frequency: 1000, gain: 0 },
      { frequency: 4000, gain: 0 },
      { frequency: 16000, gain: 0 }
    ]
  }
};

// Crear estado reactivo
const state = reactive({
  ...structuredClone(initialState),
  loading: false,
  error: null
});

// Métodos para manipular el estado
const playerStore = {
  // Estado reactivo
  state,

  // Getter para estado actual
  get currentTrack() {
    return state.currentTrack;
  },
  
  get playlist() {
    return state.playlist;
  },
  
  get isPlaying() {
    return state.isPlaying;
  },
  
  get volume() {
    return state.volume;
  },
  
  get currentTime() {
    return state.currentTime;
  },
  
  get duration() {
    return state.duration;
  },
  
  get repeat() {
    return state.repeat;
  },
  
  get shuffle() {
    return state.shuffle;
  },

  get loading() {
    return state.loading;
  },

  get error() {
    return state.error;
  },
  
  // Métodos para control de reproducción
  setTrack(track) {
    state.currentTrack = track;
    playerStore.saveState();
  },
  
  setPlaylist(tracks) {
    state.playlist = tracks;
    playerStore.saveState();
  },
  
  play() {
    state.isPlaying = true;
  },
  
  pause() {
    state.isPlaying = false;
  },
  
  setVolume(volume) {
    state.volume = volume;
    playerStore.saveState();
  },
  
  setCurrentTime(time) {
    state.currentTime = time;
  },
  
  setDuration(duration) {
    state.duration = duration;
  },
  
  toggleRepeat() {
    if (state.repeat === 'off') {
      state.repeat = 'all';
    } else if (state.repeat === 'all') {
      state.repeat = 'one';
    } else {
      state.repeat = 'off';
    }
    playerStore.saveState();
  },
  
  toggleShuffle() {
    state.shuffle = !state.shuffle;
    playerStore.saveState();
  },
  
  // Métodos para ecualizador
  toggleEqualizer() {
    state.equalizer.enabled = !state.equalizer.enabled;
    playerStore.saveState();
    // Notify audioManager to update connections
    // Ensure audioManager is imported or available globally if this approach is used.
    // For direct import, add: import audioManager from '../utils/audioManager'; at the top.
    // Assuming audioManager is globally accessible or imported for this example.
    if (typeof audioManager !== 'undefined' && audioManager.applyEqStateChange) {
      audioManager.applyEqStateChange();
    }
  },
  
  setEqualizerBand(index, gain) {
    if (index >= 0 && index < state.equalizer.bands.length) {
      state.equalizer.bands[index].gain = gain;
      console.log(`State updated for equalizer band ${index} with gain: ${gain}`);

      // Trigger audioManager to apply the change
      if (typeof audioManager !== 'undefined' && audioManager.updateEqualizerBand) {
        audioManager.updateEqualizerBand(index, gain);
      }

      playerStore.saveState();
    } else {
      console.warn(`Invalid equalizer band index: ${index}`);
    }
  },
  
  // Persistencia
  /**
   * Saves the current player state to IndexedDB.
   */
  saveState() {
    try {
      const serializableState = JSON.parse(JSON.stringify(this.state, (key, value) => {
        // Exclude non-serializable objects like AudioNodes
        if (value instanceof AudioNode) {
          return undefined;
        }
        return value;
      }));

      localforage.setItem('playerState', serializableState).then(() => {
        console.log('Player state saved successfully');
      }).catch((error) => {
        console.error('Error saving player state:', error);
      });
    } catch (error) {
      console.error('Error serializing player state:', error);
    }
  },
  
  async loadState() {
    try {
      const savedState = await localforage.getItem('playerState');
      
      if (savedState) {
        // Restauramos los valores guardados
        state.volume = savedState.volume || initialState.volume;
        state.repeat = savedState.repeat || initialState.repeat;
        state.shuffle = savedState.shuffle || initialState.shuffle;
        
        if (savedState.equalizer) {
          state.equalizer = savedState.equalizer;
        }
        
        console.log('Estado del reproductor cargado');
        return savedState.currentTrackId; // Devolvemos el ID para restaurar la pista actual
      }
    } catch (error) {
      console.error('Error al cargar el estado del reproductor:', error);
    }
    
    return null;
  },
  
  resetState() {
    // Reiniciamos a valores iniciales
    Object.assign(state, structuredClone(initialState));
  },

  async loadMusicLibrary() {
    state.loading = true;
    state.error = null;
    try {
      if (!permissionsManager.isFileSystemAccessSupported()) {
        state.error = 'Tu navegador no es compatible con la selección de directorios.';
        state.loading = false;
        return;
      }
      const dirHandle = await permissionsManager.requestMusicFolder();
      if (!dirHandle) {
        state.error = 'No se seleccionó ningún directorio.';
        state.loading = false;
        return;
      }
      const audioFiles = await permissionsManager.scanDirectoryForAudioFiles(dirHandle, true);
      if (!audioFiles.length) {
        state.error = 'No se encontraron archivos de audio en la carpeta.';
        state.loading = false;
        return;
      }
      // Asociar covers y lyrics
      const coverExtensions = ['jpg', 'jpeg', 'png'];
      const lyricsExtensions = ['lrc', 'txt'];
      const coversMap = new Map();
      const lyricsMap = new Map();
      for (const file of audioFiles) {
        const basePath = file.path.replace(/\.[^/.]+$/, '');
        for (const ext of coverExtensions) {
          const coverPath = `${basePath}.${ext}`;
          const cover = audioFiles.find(f => f.path === coverPath);
          if (cover) coversMap.set(basePath, cover);
        }
        for (const ext of lyricsExtensions) {
          const lyricsPath = `${basePath}.${ext}`;
          const lyric = audioFiles.find(f => f.path === lyricsPath);
          if (lyric) lyricsMap.set(basePath, lyric);
        }
      }
      // Crear objetos de pista
      state.playlist = audioFiles.map((file, idx) => {
        const basePath = file.path.replace(/\.[^/.]+$/, '');
        const cover = coversMap.get(basePath);
        const lyric = lyricsMap.get(basePath);
        return {
          id: `${file.name}_${file.lastModified}`,
          name: file.name,
          artist: '',
          album: '',
          coverUrl: '',
          fileHandle: file.handle,
          filePath: file.path,
          duration: 0,
          coverHandle: cover ? cover.handle : null,
          lyricsHandle: lyric ? lyric.handle : null
        };
      });
      state.currentTrack = state.playlist[0] || null;
      state.loading = false;
      // Extraer metadatos ID3 en segundo plano
      state.playlist.forEach(async (track, idx) => {
        try {
          const file = await track.fileHandle.getFile();
          if (window.jsmediatags) {
            window.jsmediatags.read(file, {
              onSuccess: tag => {
                if (tag.tags) {
                  if (tag.tags.title) state.playlist[idx].name = tag.tags.title;
                  if (tag.tags.artist) state.playlist[idx].artist = tag.tags.artist;
                  if (tag.tags.album) state.playlist[idx].album = tag.tags.album;
                  if (tag.tags.picture) {
                    const { data, format } = tag.tags.picture;
                    const byteArray = new Uint8Array(data);
                    const blob = new Blob([byteArray], { type: format });
                    const url = URL.createObjectURL(blob);
                    state.playlist[idx].coverUrl = url;
                  }
                }
              },
              onError: err => {}
            });
          }
        } catch (e) {}
      });
    } catch (error) {
      state.error = 'Error al seleccionar directorio';
      state.loading = false;
    }
  },

  // Agregar métodos para siguiente/anterior con repeat y shuffle
  nextTrack() {
    if (!state.playlist.length) return null;
    const currentId = state.currentTrack?.id;
    const currentIdx = state.playlist.findIndex(t => t.id === currentId);
    let nextIdx;
    if (state.repeat === 'one' && currentIdx >= 0) {
      nextIdx = currentIdx;
    } else if (state.shuffle) {
      do {
        nextIdx = Math.floor(Math.random() * state.playlist.length);
      } while (state.playlist.length > 1 && nextIdx === currentIdx);
    } else {
      nextIdx = (currentIdx >= 0 ? currentIdx + 1 : 0);
      if (nextIdx >= state.playlist.length) {
        if (state.repeat === 'all') nextIdx = 0;
        else return null;
      }
    }
    const track = state.playlist[nextIdx];
    state.currentTrack = track;
    playerStore.saveState();
    return track;
  },
  prevTrack() {
    if (!state.playlist.length) return null;
    const currentId = state.currentTrack?.id;
    const currentIdx = state.playlist.findIndex(t => t.id === currentId);
    let prevIdx;
    if (state.history && state.history.length) {
      // opcional: implementar historial
    }
    if (state.shuffle) {
      do {
        prevIdx = Math.floor(Math.random() * state.playlist.length);
      } while (state.playlist.length > 1 && prevIdx === currentIdx);
    } else {
      prevIdx = (currentIdx > 0 ? currentIdx - 1 : (state.repeat === 'all' ? state.playlist.length - 1 : null));
      if (prevIdx === null) return null;
    }
    const track = state.playlist[prevIdx];
    state.currentTrack = track;
    playerStore.saveState();
    return track;
  },

  /**
   * Limpia la lista de reproducción y pista actual
   */
  clearPlaylist() {
    playerStore.setPlaylist([]);
    playerStore.setTrack(null);
  },
};

export default playerStore;