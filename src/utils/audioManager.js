import playerStore from '../store/playerStore';

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

    this.initialized = false;
    this.setupMediaSession();
  }
  
  /**
   * Inicializa el contexto de audio y los nodos
   * Se debe llamar en respuesta a interacción del usuario
   */
  initialize() {
    if (this.initialized) return;
    
    // Buscamos el elemento de audio en el DOM
    this.audioElement = document.getElementById('audio-player');
    if (!this.audioElement) {
      console.error('No se encontró el elemento audio');
      return;
    }
    
    // Creamos el contexto de audio
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Conectamos el elemento de audio al contexto
      this.audioSource = this.audioContext.createMediaElementSource(this.audioElement);
      
      // Boost node
      this.boostNode = this.audioContext.createGain();
      this.boostNode.gain.value = 1;
      
      // Creamos y conectamos nodo de ganancia (volumen)
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = playerStore.volume;
      
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
    playerStore.state.equalizer.bands.forEach(band => {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = band.frequency;
      filter.Q.value = 1; 
      filter.gain.value = band.gain;
      this.equalizerNodes.push(filter);
    });
  }

  /**
   * Applies the current EQ enabled/disabled state to the audio graph.
   */
  applyEqStateChange() {
    if (!this.initialized) return;

    if (playerStore.state.equalizer.enabled) {
      console.log('Enabling EQ path');
      this._connectEqPath();
    } else {
      console.log('Bypassing EQ path');
      this._bypassEqPath();
    }
  }
  
  /**
   * Inserts the EQ filter chain into the audio path: boostNode -> EQ -> gainNode.
   */
  _connectEqPath() {
    if (!this.initialized || !this.equalizerNodes.length) {
      console.warn('Cannot connect EQ path: Not initialized or no EQ nodes');
      return;
    }

    try {
      this.boostNode.disconnect(); // Disconnect boostNode from gainNode (bypass)

      let currentNode = this.boostNode;
      this.equalizerNodes.forEach((filterNode, index) => {
        currentNode.connect(filterNode);
        console.log(`Connected EQ node ${index} with frequency: ${filterNode.frequency.value}`);
        currentNode = filterNode;
      });
      currentNode.connect(this.gainNode); // Connect end of EQ chain to gainNode
      console.log('EQ path connected successfully');
    } catch (error) {
      console.error('Error connecting EQ path:', error);
    }
  }
  
  /**
   * Bypasses the EQ filter chain: boostNode -> gainNode.
   */
  _bypassEqPath() {
    if (!this.initialized) {
      console.warn('Cannot bypass EQ path: Not initialized');
      return;
    }

    try {
      this.boostNode.disconnect(); // Disconnect boostNode from start of EQ chain (if connected)

      // Disconnect each EQ node to be safe, though disconnecting boostNode should suffice for its output
      this.equalizerNodes.forEach((filterNode, index) => {
        filterNode.disconnect();
        console.log(`Disconnected EQ node ${index} with frequency: ${filterNode.frequency.value}`);
      });

      this.boostNode.connect(this.gainNode); // Reconnect boostNode directly to gainNode
      console.log('EQ path bypassed successfully');
    } catch (error) {
      console.error('Error bypassing EQ path:', error);
    }
  }
  
  /**
   * Updates a specific equalizer band and logs the change for debugging.
   */
  updateEqualizerBand(index, gain) {
    if (!this.initialized || index < 0 || index >= this.equalizerNodes.length) {
      console.warn(`Invalid equalizer band index: ${index}`);
      return;
    }

    this.equalizerNodes[index].gain.value = gain;
    console.log(`Equalizer band ${index} updated with gain: ${gain}`);

    // Ensure the EQ chain is active and reconnected to apply changes
    console.log('Reconnecting EQ path to apply changes');
    this._connectEqPath();
  }
  
  /**
   * Configura los eventos del elemento de audio
   */
  setupAudioEvents() {
    if (!this.audioElement) return;
    
    // Actualización de tiempo
    this.audioElement.addEventListener('timeupdate', () => {
      playerStore.setCurrentTime(this.audioElement.currentTime);
    });
    
    // Duración disponible
    this.audioElement.addEventListener('loadedmetadata', () => {
      playerStore.setDuration(this.audioElement.duration);
    });
    
    // Fin de reproducción
    this.audioElement.addEventListener('ended', async () => {
      // Intentar siguiente pista según repeat/shuffle
      const nextTrack = playerStore.nextTrack();
      if (nextTrack && nextTrack.fileHandle) {
        try {
          await this.playFile(nextTrack.fileHandle);
        } catch (e) {
          console.error('Error reproduciendo siguiente pista:', e);
        }
      } else {
        playerStore.pause();
      }
    });
    
    // Error de reproducción
    this.audioElement.addEventListener('error', (e) => {
      console.error('Error en reproducción de audio:', e);
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
        // Implementación futura: pista anterior
      });
      
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        // Implementación futura: siguiente pista
      });
      
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (this.audioElement && details.seekTime) {
          this.audioElement.currentTime = details.seekTime;
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
    if (!fileHandle) return Promise.reject('No se proporcionó un manejador de archivo');
    
    try {
      // Inicializamos si es necesario
      if (!this.initialized) {
        this.initialize();
      }
      
      // Obtenemos el archivo
      const file = await fileHandle.getFile();
      
      // Creamos una URL para el archivo
      const fileUrl = URL.createObjectURL(file);
      
      // Asignamos la URL al elemento de audio
      this.audioElement.src = fileUrl;
      
      // Reproducimos
      return this.play();
    } catch (error) {
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
            playerStore.play();
            this.updateMediaSessionMetadata(playerStore.currentTrack);
          })
          .catch(error => {
            console.error('Error al reproducir:', error);
            playerStore.pause();
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
      playerStore.pause();
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
    playerStore.setVolume(safeVolume);
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
}

// Exportamos una sola instancia
const audioManager = new AudioManager();
export default audioManager;
