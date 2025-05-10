import { usePlayerStore } from '../store/playerStore';

/**
 * Gestor de reproducción de audio
 * Administra la interacción con Web Audio API para reproducción y efectos
 */
class AudioManager {
  constructor() {
    this.audioElement = null;
    this.audioContext = null;
    this.audioSource = null;
    this.boostNode = null;
    this.gainNode = null;
    this.analyserNode = null;
    this.equalizerNodes = [];
    this.compressorNode = null;
    this.playerStore = null;

    this.initialized = false;
    this.setupMediaSession();
  }
  
  /**
   * Inicializa el contexto de audio y los nodos
   * Se debe llamar en respuesta a interacción del usuario
   */
  initialize() {
    if (this.initialized) return;
    
    try {
      // Obtener la instancia de Pinia Store
      this.playerStore = usePlayerStore();
      
      // Buscamos el elemento de audio en el DOM o lo creamos si no existe
      this.audioElement = document.getElementById('audio-player');
      if (!this.audioElement) {
        console.warn('No se encontró el elemento audio, creando uno nuevo');
        this.audioElement = document.createElement('audio');
        this.audioElement.id = 'audio-player';
        this.audioElement.style.display = 'none';
        document.body.appendChild(this.audioElement);
      }
      
      // Creamos el contexto de audio
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Conectamos el elemento de audio al contexto
      this.audioSource = this.audioContext.createMediaElementSource(this.audioElement);
      
      // Boost node
      this.boostNode = this.audioContext.createGain();
      this.boostNode.gain.value = 1;
      
      // Creamos y conectamos nodo de ganancia (volumen)
      this.gainNode = this.audioContext.createGain();
      if (this.playerStore) {
        this.gainNode.gain.value = this.playerStore.volume;
      } else {
        this.gainNode.gain.value = 0.7; // Valor por defecto
      }
      
      // Creamos y conectamos el analizador para visualizaciones
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      
      // Conexión base: fuente -> boost -> ganancia -> analizador -> destino
      this.audioSource.connect(this.boostNode);
      this.boostNode.connect(this.gainNode);
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
      
      // Eventos de audio
      this.setupEqualizer();
      this.setupAudioEvents();
      
      this.initialized = true;
      console.log('AudioManager inicializado correctamente');
      
      // Apply initial EQ state after everything is set up
      this.applyEqStateChange();
    } catch (error) {
      console.error('Error al inicializar AudioManager:', error);
    }
  }
  
  /**
   * Configura los nodos de filtro para el ecualizador. Solo crea los nodos.
   */
  setupEqualizer() {
    this.equalizerNodes = [];
    if (!this.audioContext) return;
    
    if (this.playerStore && this.playerStore.equalizer && this.playerStore.equalizer.bands) {
      this.playerStore.equalizer.bands.forEach(band => {
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = band.frequency;
        filter.Q.value = 1; 
        filter.gain.value = band.gain;
        this.equalizerNodes.push(filter);
      });
    } else {
      // Bandas por defecto si no hay store disponible
      const defaultBands = [
        { frequency: 60, gain: 0 },
        { frequency: 250, gain: 0 },
        { frequency: 1000, gain: 0 },
        { frequency: 4000, gain: 0 },
        { frequency: 16000, gain: 0 }
      ];
      
      defaultBands.forEach(band => {
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = band.frequency;
        filter.Q.value = 1; 
        filter.gain.value = band.gain;
        this.equalizerNodes.push(filter);
      });
    }
  }

  /**
   * Aplica el estado actual del ecualizador (activado/desactivado) al grafo de audio.
   */
  applyEqStateChange() {
    if (!this.initialized) return;

    if (this.playerStore && this.playerStore.equalizer.enabled) {
      console.log('Activando ecualizador');
      this._connectEqPath();
    } else {
      console.log('Desactivando ecualizador');
      this._bypassEqPath();
    }
  }
  
  /**
   * Inserta la cadena de filtros del ecualizador en el camino de audio: boostNode -> EQ -> gainNode.
   */
  _connectEqPath() {
    if (!this.initialized || !this.equalizerNodes.length) {
      console.warn('No se puede conectar ecualizador: No inicializado o sin nodos de ecualización');
      return;
    }

    try {
      this.boostNode.disconnect(); // Desconectar boostNode de gainNode (bypass)

      let currentNode = this.boostNode;
      this.equalizerNodes.forEach((filterNode, index) => {
        currentNode.connect(filterNode);
        console.log(`Conectado nodo EQ ${index} con frecuencia: ${filterNode.frequency.value}`);
        currentNode = filterNode;
      });
      currentNode.connect(this.gainNode); // Conectar final de cadena EQ a gainNode
      console.log('Conexión de ecualizador exitosa');
    } catch (error) {
      console.error('Error conectando ecualizador:', error);
    }
  }
  
  /**
   * Bypassa la cadena de filtros: boostNode -> gainNode.
   */
  _bypassEqPath() {
    if (!this.initialized) {
      console.warn('No se puede bypass: No inicializado');
      return;
    }

    try {
      this.boostNode.disconnect(); // Desconectar boostNode del inicio de cadena EQ (si conectado)

      // Desconectar cada nodo EQ para seguridad
      this.equalizerNodes.forEach((filterNode, index) => {
        filterNode.disconnect();
      });

      this.boostNode.connect(this.gainNode); // Reconectar boostNode directo a gainNode
      console.log('Bypass de ecualizador exitoso');
    } catch (error) {
      console.error('Error en bypass del ecualizador:', error);
    }
  }
  
  /**
   * Actualiza una banda específica del ecualizador y registra el cambio para depuración.
   */
  updateEqualizerBand(index, gain) {
    if (!this.initialized || index < 0 || index >= this.equalizerNodes.length) {
      console.warn(`Índice inválido para banda de ecualización: ${index}`);
      return;
    }

    this.equalizerNodes[index].gain.value = gain;
    console.log(`Banda de ecualización ${index} actualizada con ganancia: ${gain}`);

    // Asegurar que la cadena de ecualización esté activa y reconectada para aplicar cambios
    console.log('Reconectando ecualizador para aplicar cambios');
    this._connectEqPath();
  }
  
  /**
   * Configura los eventos del elemento de audio
   */
  setupAudioEvents() {
    if (!this.audioElement) return;
    
    // Actualización de tiempo
    this.audioElement.addEventListener('timeupdate', () => {
      if (this.playerStore) {
        this.playerStore.updateCurrentTime(this.audioElement.currentTime);
      }
    });
    
    // Duración disponible
    this.audioElement.addEventListener('loadedmetadata', () => {
      if (this.playerStore) {
        this.playerStore.updateDuration(this.audioElement.duration);
      }
    });
    
    // Fin de reproducción
    this.audioElement.addEventListener('ended', () => {
      if (this.playerStore) {
        // Reproducir siguiente pista según estado del player
        const nextTrack = this.playerStore.playNext();
        if (nextTrack && nextTrack.fileHandle) {
          this.playFile(nextTrack.fileHandle)
            .catch(error => console.error('Error reproduciendo siguiente pista:', error));
        } else {
          this.playerStore.setPlayingState(false);
        }
      }
    });
    
    // Error de reproducción
    this.audioElement.addEventListener('error', (e) => {
      console.error('Error en reproducción de audio:', e);
      if (this.playerStore) {
        this.playerStore.setPlayingState(false);
        this.playerStore.error = 'Error al reproducir el audio';
      }
    });
  }
  
  /**
   * Configura MediaSession API para controles multimedia del sistema
   */
  setupMediaSession() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        this.play();
      });
      
      navigator.mediaSession.setActionHandler('pause', () => {
        this.pause();
      });
      
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (this.playerStore) {
          const prevTrack = this.playerStore.playPrevious();
          if (prevTrack && prevTrack.fileHandle) {
            this.playFile(prevTrack.fileHandle);
          }
        }
      });
      
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (this.playerStore) {
          const nextTrack = this.playerStore.playNext();
          if (nextTrack && nextTrack.fileHandle) {
            this.playFile(nextTrack.fileHandle);
          }
        }
      });
      
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (this.audioElement && details.seekTime != null) {
          this.audioElement.currentTime = details.seekTime;
        }
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        this.pause();
        if (this.audioElement) {
          this.audioElement.currentTime = 0;
        }
        if (this.playerStore) {
          this.playerStore.setPlayingState(false);
        }
      });
    }
  }
  
  /**
   * Actualiza metadata para MediaSession API
   */
  updateMediaSessionMetadata(track) {
    if (!('mediaSession' in navigator) || !track) return;
    
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.name || 'Desconocido',
        artist: track.artist || 'Artista desconocido',
        album: track.album || 'Álbum desconocido',
        artwork: track.coverUrl ? [{ src: track.coverUrl }] : []
      });
    } catch (e) {
      console.error('Error al actualizar metadata de MediaSession:', e);
    }
  }
  
  /**
   * Reproduce un archivo a partir de su FileSystemFileHandle
   */
  async playFile(fileHandle) {
    if (!fileHandle) {
      console.error('No se proporcionó un manejador de archivo');
      return Promise.reject('No se proporcionó un manejador de archivo');
    }
    try {
      // Inicializamos si es necesario
      if (!this.initialized) {
        this.initialize();
      }

      // Verificamos y solicitamos permisos si es necesario
      const permission = await fileHandle.queryPermission({ mode: 'read' });
      if (permission !== 'granted') {
        console.log('Solicitando permiso para archivo...');
        const requestPermission = await fileHandle.requestPermission({ mode: 'read' });
        if (requestPermission !== 'granted') {
          throw new Error('Permiso denegado para acceder al archivo');
        }
      }

      // Pausar y limpiar el elemento de audio antes de asignar nueva pista
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.removeAttribute('src');
        this.audioElement.load();
      }

      // Obtenemos el archivo
      const file = await fileHandle.getFile();

      // Creamos una URL para el archivo
      const fileUrl = URL.createObjectURL(file);

      // Limpiamos cualquier URL anterior para evitar fugas de memoria
      if (this.audioElement.src) {
        URL.revokeObjectURL(this.audioElement.src);
      }

      // Asignamos la URL al elemento de audio
      this.audioElement.src = fileUrl;

      // Reproducimos
      console.log('Reproduciendo archivo:', file.name);
      const playPromise = this.play();

      // Actualizar el título de la página con la info de la pista
      if (this.playerStore && this.playerStore.currentTrack) {
        const track = this.playerStore.currentTrack;
        document.title = `${track.name || 'Desconocido'} - ${track.artist || 'Desconocido'} | PWA Music Player`;
      }

      return playPromise;
    } catch (error) {
      console.error('Error al reproducir archivo:', error);
      if (this.playerStore) {
        this.playerStore.error = `Error al reproducir: ${error.message}`;
        this.playerStore.setPlayingState(false);
      }
      return Promise.reject(`Error al reproducir archivo: ${error.message}`);
    }
  }
  
  /**
   * Reproduce audio
   */
  play() {
    if (!this.initialized) {
      this.initialize();
    }
    
    if (this.audioElement && this.audioElement.src) {
      // Reanudar el contexto de audio si está suspendido
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      const playPromise = this.audioElement.play();
      
      // Play puede devolver una promesa, la manejamos adecuadamente
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (this.playerStore) {
              this.playerStore.setPlayingState(true);
              this.updateMediaSessionMetadata(this.playerStore.currentTrack);
            }
          })
          .catch(error => {
            console.error('Error al reproducir:', error);
            if (this.playerStore) {
              this.playerStore.setPlayingState(false);
              this.playerStore.error = `Error al reproducir: ${error.message}`;
            }
          });
      }
      
      return playPromise;
    }
    
    return Promise.resolve();
  }
  
  /**
   * Pausa el audio
   */
  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
      if (this.playerStore) {
        this.playerStore.setPlayingState(false);
      }
    }
  }
  
  /**
   * Establece el tiempo de reproducción
   */
  setCurrentTime(time) {
    if (this.audioElement) {
      this.audioElement.currentTime = time;
    }
  }
  
  /**
   * Establece el volumen
   */
  setVolume(volume) {
    if (!this.initialized) {
      this.initialize();
    }
    
    // Aseguramos que el volumen esté entre 0 y 1
    const safeVolume = Math.max(0, Math.min(1, volume));
    
    // Actualizamos el volumen del nodo de ganancia
    if (this.gainNode) {
      this.gainNode.gain.value = safeVolume;
    }
    
    // Actualizamos también el elemento de audio como respaldo
    if (this.audioElement) {
      this.audioElement.volume = safeVolume;
    }
    
    // Actualizamos el store
    if (this.playerStore) {
      this.playerStore.setVolume(safeVolume);
    }
  }
  
  /**
   * Establece boost de volumen (ganancia extra)
   */
  setBoost(gain) {
    if (!this.boostNode) return;
    this.boostNode.gain.value = gain;
  }

  /**
   * Habilita normalizador (DynamicsCompressorNode)
   */
  enableNormalizer() {
    if (!this.audioContext || !this.gainNode || this.compressorNode) return;
    this.compressorNode = this.audioContext.createDynamicsCompressor();
    // reconnect: boost -> compressor -> gain
    this.boostNode.disconnect();
    this.boostNode.connect(this.compressorNode);
    this.compressorNode.connect(this.gainNode);
  }

  /**
   * Deshabilita normalizador
   */
  disableNormalizer() {
    if (!this.compressorNode) return;
    this.boostNode.disconnect();
    this.compressorNode.disconnect();
    this.boostNode.connect(this.gainNode);
    this.compressorNode = null;
  }

  /**
   * Obtiene datos para visualización
   */
  getAnalyserData() {
    if (!this.analyserNode) return null;
    
    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    this.analyserNode.getByteFrequencyData(dataArray);
    
    return dataArray;
  }
  
  /**
   * Desconecta y limpia recursos
   */
  dispose() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      
      if (this.audioElement.src) {
        URL.revokeObjectURL(this.audioElement.src);
      }
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.audioElement = null;
    this.audioContext = null;
    this.audioSource = null;
    this.gainNode = null;
    this.analyserNode = null;
    this.equalizerNodes = [];
    this.initialized = false;
  }

  /**
   * Notificación si termina la playlist o hay error/crash
   */
  notifyEndOrError(reason) {
    if ('Notification' in window && Notification.permission === 'granted') {
      let body = '';
      if (reason === 'end') {
        body = 'La playlist ha terminado.';
      } else {
        body = 'Ocurrió un error en la reproducción.';
      }
      new Notification('PWA Music Player', {
        body,
        icon: '/icons/icon-192x192.png'
      });
    }
  }
}

// Exportamos una sola instancia
const audioManager = new AudioManager();
export default audioManager;
