// Gestor de audio para el reproductor de música
let audio = null;
let audioContext = null;
let sourceNode = null;
let gainNode = null;
let analyserNode = null;
let initialized = false;
let timeUpdateCallbacks = [];

// Inicializar el audio
function init() {
  if (initialized) return;
  
  // Crear elemento de audio si no existe
  if (!audio) {
    // Primero buscar el elemento existente en el DOM
    audio = document.getElementById('audio-player');
    
    // Si no hay un elemento de audio en el DOM, crear uno nuevo
    if (!audio) {
      audio = new Audio();
      audio.id = 'audio-player';
      audio.preload = 'metadata';
      document.body.appendChild(audio); // Añadir al DOM para evitar problemas
    }
  }
  
  // Crear contexto de audio si no existe y es soportado por el navegador
  if (!audioContext && window.AudioContext) {
    audioContext = new AudioContext();
    
    // Crear nodo de ganancia para controlar volumen
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
  }
  
  // Configurar listeners de eventos
  setupTimeUpdateListener();
  
  initialized = true;
}

// Instalar listeners de tiempo
function setupTimeUpdateListener() {
  if (!audio) return;

  // Limpiar listeners previos para evitar duplicación
  audio.removeEventListener('timeupdate', handleTimeUpdate);
  
  // Añadir listener de actualización de tiempo
  audio.addEventListener('timeupdate', handleTimeUpdate);
}

// Manejar evento de actualización de tiempo
function handleTimeUpdate() {
  if (!audio) return;
  
  // Despachar evento personalizado con el tiempo actual
  const timeEvent = new CustomEvent('audioTimeUpdate', { 
    detail: { currentTime: audio.currentTime, duration: audio.duration } 
  });
  audio.dispatchEvent(timeEvent);
  
  // Notificar a los callbacks registrados
  timeUpdateCallbacks.forEach(callback => {
    try {
      callback(audio.currentTime, audio.duration);
    } catch (error) {
      console.error('Error en callback de actualización de tiempo:', error);
    }
  });
}

// Cargar y reproducir un archivo
async function playFile(fileHandle) {
  try {
    // Inicializar componentes de audio
    init();
    
    if (!fileHandle) {
      throw new Error('No se proporcionó un manejador de archivo válido');
    }
    
    // Pausar cualquier reproducción actual
    if (!audio.paused) {
      audio.pause();
    }
    
    // Liberar cualquier URL de objeto anterior para evitar fugas de memoria
    if (audio.src && audio.src.startsWith('blob:')) {
      URL.revokeObjectURL(audio.src);
    }
    
    // Obtener el archivo
    const file = await fileHandle.getFile();
    
    // Crear un objeto URL del archivo para reproducirlo
    const url = URL.createObjectURL(file);
    
    // Configurar la fuente de audio
    audio.src = url;
    audio.currentTime = 0;
    
    // Asegurarnos de cargar los metadatos para obtener la duración
    return new Promise((resolve, reject) => {
      const loadHandler = () => {
        // Emitir el evento para actualizar la duración en la interfaz
        const durationEvent = new CustomEvent('durationchange', { 
          detail: { duration: audio.duration }
        });
        audio.dispatchEvent(durationEvent);
        
        // Reproducir el audio
        audio.play().then(() => {
          // Si AudioContext está en estado suspendido (política de reproducción automática del navegador)
          if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
          }
          
          // Conectar el elemento de audio al contexto de Web Audio API si aún no está conectado
          if (!sourceNode && audioContext) {
            sourceNode = audioContext.createMediaElementSource(audio);
            sourceNode.connect(gainNode);
          }
          
          resolve(true);
        }).catch(error => {
          console.error('Error al reproducir audio:', error);
          reject(error);
        });
      };
      
      const errorHandler = (error) => {
        console.error('Error al cargar el archivo de audio:', error);
        reject(error);
      };
      
      // Configurar manejadores de eventos
      audio.onloadedmetadata = loadHandler;
      audio.onerror = errorHandler;
    });
  } catch (error) {
    console.error('Error al cargar el archivo de audio:', error);
    return false;
  }
}

// Reproducir audio
function play() {
  try {
    if (audio && audio.readyState >= 2) {
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error al reproducir audio:', error);
        });
      }
    }
  } catch (error) {
    console.error('Error al reproducir:', error);
  }
}

// Pausar audio
function pause() {
  if (audio) {
    audio.pause();
  }
}

// Establecer volumen (0-1)
function setVolume(value) {
  if (gainNode) {
    // Usar una curva logarítmica para una respuesta más natural
    const vol = Math.max(0, Math.min(1, value));
    gainNode.gain.value = vol;
  }
  
  if (audio) {
    audio.volume = Math.max(0, Math.min(1, value));
  }
}

// Ir a una posición específica
function seekTo(time) {
  if (audio) {
    audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0));
  }
}

// Obtener tiempo actual
function getCurrentTime() {
  return audio ? audio.currentTime : 0;
}

// Obtener duración
function getDuration() {
  return audio ? (audio.duration || 0) : 0;
}

// Obtener datos para el visualizador
function getAnalyserData() {
  if (!analyserNode) return null;
  
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  // Obtener datos de frecuencia
  analyserNode.getByteFrequencyData(dataArray);
  
  return dataArray;
}

// Configurar ecualizador
function setEqualizerBands(bands) {
  // La implementación completa del ecualizador requeriría varios nodos de filtro
  console.log('Configurando ecualizador con bandas:', bands);
}

// Limpiar y liberar recursos
function cleanup() {
  if (audio) {
    audio.pause();
    audio.src = '';
    audio.load();
  }
  
  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }
  
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close().catch(error => {
      console.error('Error al cerrar el contexto de audio:', error);
    });
    audioContext = null;
  }
  
  gainNode = null;
  analyserNode = null;
}

// Añadir evento de finalización
function onEnded(callback) {
  if (audio && callback && typeof callback === 'function') {
    audio.addEventListener('ended', callback);
    return true;
  }
  return false;
}

// Añadir evento de actualización de tiempo
function onTimeUpdate(callback) {
  if (audio && callback && typeof callback === 'function') {
    timeUpdateCallbacks.push(callback);
    return true;
  }
}

export default {
  init,
  playFile,
  play,
  pause,
  setVolume,
  seekTo,
  getCurrentTime,
  getDuration,
  getAnalyserData,
  setEqualizerBands,
  cleanup,
  onEnded,
  onTimeUpdate
};
