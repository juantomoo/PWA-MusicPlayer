import { defineStore } from 'pinia';
import localforage from 'localforage';
import audioManager from '../utils/audioManager';

// Configuración de localforage para el player
localforage.config({
  name: 'PWA Music Player',
  storeName: 'player_store'
});

// Definición del store con Pinia
export const usePlayerStore = defineStore('player', {
  state: () => ({
    currentTrack: null,
    globalPlaylist: [],
    playbackIndex: 0,
    isShuffle: false,
    isRepeat: false,
    volume: 0.7,
    isPlaying: false,
    lastUsedPlaylistId: null,
    currentTime: 0,
    duration: 0,
    loading: false,
    error: null,
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
  }),

  actions: {
    // Establecer la playlist global
    setGlobalPlaylist(playlist) {
      if (!playlist || !Array.isArray(playlist)) {
        console.warn('No se proporcionó una playlist válida');
        return;
      }
      
      this.globalPlaylist = [...playlist];
      
      // Si hay lista pero no hay pista actual seleccionada,
      // seleccionamos la primera
      if (this.globalPlaylist.length > 0 && !this.currentTrack) {
        this.currentTrack = this.globalPlaylist[0];
        this.playbackIndex = 0;
      }
      
      // Guardar estado
      this.saveState();
    },

    // Establecer la pista actual
    setCurrentTrack(track) {
      if (!track) return;
      
      this.currentTrack = track;
      
      // Actualizar índice si la pista está en la playlist global
      if (this.globalPlaylist.length > 0) {
        const index = this.globalPlaylist.findIndex(t => 
          t.id === track.id || 
          (t.name === track.name && t.artist === track.artist && t.album === track.album)
        );
        
        if (index !== -1) {
          this.playbackIndex = index;
        }
      }
      
      // Actualizar metadata para MediaSession API
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.name || 'Desconocido',
          artist: track.artist || 'Artista desconocido',
          album: track.album || 'Álbum desconocido',
          artwork: track.coverUrl ? [{ src: track.coverUrl }] : []
        });
      }
      
      // Guardar estado
      this.saveState();
    },

    // Reproducir siguiente pista
    playNext() {
      if (!this.globalPlaylist || this.globalPlaylist.length === 0) return null;

      let nextIndex;
      
      if (this.isShuffle) {
        // Modo aleatorio
        nextIndex = Math.floor(Math.random() * this.globalPlaylist.length);
      } else {
        // Modo secuencial
        nextIndex = this.playbackIndex + 1;
        
        // Si llegamos al final y está activado el modo repetición, volvemos al principio
        if (nextIndex >= this.globalPlaylist.length) {
          if (this.isRepeat) {
            nextIndex = 0;
          } else {
            return null; // Fin de la playlist sin repetición
          }
        }
      }
      
      this.playbackIndex = nextIndex;
      this.currentTrack = this.globalPlaylist[nextIndex];
      
      // Guardar estado
      this.saveState();
      
      return this.currentTrack;
    },

    // Reproducir pista anterior
    playPrevious() {
      if (!this.globalPlaylist || this.globalPlaylist.length === 0) return null;

      let prevIndex;
      
      if (this.isShuffle) {
        // Modo aleatorio
        prevIndex = Math.floor(Math.random() * this.globalPlaylist.length);
      } else {
        // Modo secuencial
        prevIndex = this.playbackIndex - 1;
        
        // Si estamos al inicio y está activado el modo repetición, vamos al final
        if (prevIndex < 0) {
          if (this.isRepeat) {
            prevIndex = this.globalPlaylist.length - 1;
          } else {
            return null; // Inicio de la playlist sin repetición
          }
        }
      }
      
      this.playbackIndex = prevIndex;
      this.currentTrack = this.globalPlaylist[prevIndex];
      
      // Guardar estado
      this.saveState();
      
      return this.currentTrack;
    },

    // Activar/Desactivar modo aleatorio
    toggleShuffle() {
      this.isShuffle = !this.isShuffle;
      this.saveState();
    },

    // Activar/Desactivar repetición
    toggleRepeat() {
      this.isRepeat = !this.isRepeat;
      this.saveState();
    },

    // Establecer el estado de reproducción
    setPlayingState(isPlaying) {
      this.isPlaying = isPlaying;
      this.saveState();
    },

    // Establecer volumen
    setVolume(volume) {
      // Asegurar que el volumen esté entre 0 y 1
      const safeVolume = Math.min(1, Math.max(0, volume));
      this.volume = safeVolume;
      this.saveState();
    },
    
    // Actualizar tiempo actual
    updateCurrentTime(time) {
      this.currentTime = time;
    },
    
    // Actualizar duración
    updateDuration(duration) {
      this.duration = duration;
    },

    // Guardar ID de la última playlist usada
    setLastUsedPlaylistId(id) {
      this.lastUsedPlaylistId = id;
      
      // Guardar en local storage también para persistencia
      try {
        localStorage.setItem('lastUsedPlaylistId', id);
      } catch (e) {
        console.warn('No se pudo guardar lastUsedPlaylistId en localStorage', e);
      }
      
      this.saveState();
    },
    
    // Guardar estado completo
    saveState() {
      try {
        // Filtrar propiedades no serializables antes de guardar
        const serializableState = {
          lastUsedPlaylistId: this.lastUsedPlaylistId,
          volume: this.volume,
          isShuffle: this.isShuffle,
          isRepeat: this.isRepeat,
          equalizer: this.equalizer,
          currentTrackId: this.currentTrack?.id
        };
        
        localforage.setItem('playerState', serializableState)
          .catch(error => console.error('Error al guardar estado:', error));
      } catch (error) {
        console.error('Error al serializar estado:', error);
      }
    },
    
    // Cargar estado guardado
    async loadState() {
      try {
        const savedState = await localforage.getItem('playerState');
        
        if (savedState) {
          // Restauramos los valores guardados
          if (savedState.volume !== undefined) this.volume = savedState.volume;
          if (savedState.isRepeat !== undefined) this.isRepeat = savedState.isRepeat;
          if (savedState.isShuffle !== undefined) this.isShuffle = savedState.isShuffle;
          if (savedState.equalizer) this.equalizer = savedState.equalizer;
          if (savedState.lastUsedPlaylistId) this.lastUsedPlaylistId = savedState.lastUsedPlaylistId;
          
          return savedState.currentTrackId;
        }
      } catch (error) {
        console.error('Error al cargar estado guardado:', error);
      }
      
      return null;
    },
    
    // Alternar el ecualizador
    toggleEqualizer() {
      this.equalizer.enabled = !this.equalizer.enabled;
      
      // Notificar a audioManager para aplicar cambios
      if (audioManager.applyEqStateChange) {
        audioManager.applyEqStateChange();
      }
      
      this.saveState();
    },
    
    // Modificar una banda del ecualizador
    setEqualizerBand(index, gain) {
      if (index >= 0 && index < this.equalizer.bands.length) {
        this.equalizer.bands[index].gain = gain;
        
        // Notificar a audioManager para aplicar cambios
        if (audioManager.updateEqualizerBand) {
          audioManager.updateEqualizerBand(index, gain);
        }
        
        this.saveState();
      } else {
        console.warn(`Banda de ecualizador inválida: ${index}`);
      }
    }
  }
});