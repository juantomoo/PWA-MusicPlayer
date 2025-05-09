// Lógica de gestión de listas de reproducción
export default {
  // Métodos: addTrack, removeTrack, getTracks, etc.
};

// Storage key for playlists
const PLAYLISTS_STORAGE_KEY = 'pwa-musicplayer-playlists-v1';

// Gestionar el acceso al directorio de música y listas de reproducción
const DIRECTORY_HANDLE_KEY = 'music-directory-handle';

// Get all playlists from local storage
export function getAllPlaylists() {
  try {
    const data = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading playlists:', error);
  }
  return [];
}

// Save all playlists to local storage
function saveAllPlaylists(playlists) {
  try {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
    return true;
  } catch (error) {
    console.error('Error saving playlists:', error);
    return false;
  }
}

// Create a new playlist
export function createPlaylist(name) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return null;
  }
  
  const playlists = getAllPlaylists();
  const newPlaylist = {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    tracks: []
  };
  
  playlists.push(newPlaylist);
  saveAllPlaylists(playlists);
  return newPlaylist;
}

// Delete a playlist
export function removePlaylist(playlistId) {
  let playlists = getAllPlaylists();
  const initialLength = playlists.length;
  
  playlists = playlists.filter(playlist => playlist.id !== playlistId);
  
  if (playlists.length !== initialLength) {
    saveAllPlaylists(playlists);
    return true;
  }
  return false;
}

// Add a track to a playlist
export function addTrackToPlaylist(track, playlistId) {
  const playlists = getAllPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  
  if (!playlist) return false;
  
  // Check if track is already in playlist
  if (playlist.tracks.some(t => t.id === track.id)) {
    return false;
  }
  
  playlist.tracks.push({...track});
  saveAllPlaylists(playlists);
  return true;
}

// Remove a track from a playlist
export function removeTrackFromPlaylist(trackId, playlistId) {
  const playlists = getAllPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  
  if (!playlist) return false;
  
  const initialLength = playlist.tracks.length;
  playlist.tracks = playlist.tracks.filter(track => track.id !== trackId);
  
  if (playlist.tracks.length !== initialLength) {
    saveAllPlaylists(playlists);
    return true;
  }
  return false;
}

/**
 * Guarda un FileSystemDirectoryHandle en IndexedDB para uso futuro
 * @param {FileSystemDirectoryHandle} dirHandle - El manejador del directorio
 */
export async function saveDirectoryHandle(dirHandle) {
  if (!dirHandle || typeof dirHandle.queryPermission !== 'function') {
    throw new Error('Manejador de directorio inválido');
  }
  
  try {
    // Verificar si el navegador soporta IndexedDB
    if (!window.indexedDB) {
      console.warn('IndexedDB no está soportado en este navegador');
      return;
    }
    
    // Convertir el handle para almacenarlo en localStorage
    localStorage.setItem(DIRECTORY_HANDLE_KEY, JSON.stringify({
      id: dirHandle.name,
      kind: dirHandle.kind,
      timestamp: Date.now()
    }));
    
    // Almacenar el FileSystemDirectoryHandle real
    if ('caches' in window) {
      const cache = await caches.open('dir-handles');
      await cache.put(DIRECTORY_HANDLE_KEY, new Response(JSON.stringify(dirHandle)));
    } else {
      // Caché fallback usando IndexedDB
      const db = await openDB();
      const tx = db.transaction(['handles'], 'readwrite');
      const store = tx.objectStore('handles');
      await store.put(dirHandle, DIRECTORY_HANDLE_KEY);
      await tx.complete;
      db.close();
    }
    
    return true;
  } catch (error) {
    console.error('Error al guardar el manejador de directorio:', error);
    return false;
  }
}

/**
 * Obtiene el FileSystemDirectoryHandle almacenado anteriormente
 */
export async function getDirectoryHandle() {
  // En navegadores que no soportan File System Access API
  if (!('showDirectoryPicker' in window)) {
    return null;
  }
  
  try {
    // Primero intentamos obtener de IndexedDB/Cache
    if ('caches' in window) {
      const cache = await caches.open('dir-handles');
      const response = await cache.match(DIRECTORY_HANDLE_KEY);
      if (response) {
        return await response.json();
      }
    } else {
      // Fallback a IndexedDB
      const db = await openDB();
      const tx = db.transaction(['handles'], 'readonly');
      const store = tx.objectStore('handles');
      const dirHandle = await store.get(DIRECTORY_HANDLE_KEY);
      db.close();
      
      if (dirHandle) {
        return dirHandle;
      }
    }
  } catch (error) {
    console.warn('Error al recuperar el manejador de directorio:', error);
  }
  
  return null;
}

/**
 * Elimina el FileSystemDirectoryHandle almacenado
 */
export async function clearDirectoryHandle() {
  try {
    localStorage.removeItem(DIRECTORY_HANDLE_KEY);
    
    // Limpiar de cache
    if ('caches' in window) {
      const cache = await caches.open('dir-handles');
      await cache.delete(DIRECTORY_HANDLE_KEY);
    }
    
    // Limpiar de IndexedDB
    const db = await openDB();
    const tx = db.transaction(['handles'], 'readwrite');
    const store = tx.objectStore('handles');
    await store.delete(DIRECTORY_HANDLE_KEY);
    await tx.complete;
    db.close();
    
    return true;
  } catch (error) {
    console.error('Error al eliminar el manejador de directorio:', error);
    return false;
  }
}

/**
 * Abre la base de datos IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('pwa-music-player-db', 1);
    
    request.onerror = event => {
      reject('Error al abrir la base de datos');
    };
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      // Crear object store si no existe
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles');
      }
    };
  });
}

/**
 * Lee y procesa un archivo de lista de reproducción
 * @param {File} file - Archivo de lista de reproducción
 * @returns {Array} Lista de pistas
 */
export async function parsePlaylistFile(file) {
  try {
    const content = await file.text();
    const extension = file.name.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'm3u':
        return parseM3UPlaylist(content);
      case 'pls':
        return parsePLSPlaylist(content);
      case 'json':
        return parseJSONPlaylist(content);
      default:
        throw new Error('Formato de lista de reproducción no soportado');
    }
  } catch (error) {
    console.error('Error al analizar la lista de reproducción:', error);
    return [];
  }
}

/**
 * Analiza una lista de reproducción en formato M3U
 * @param {string} content - Contenido del archivo M3U
 * @returns {Array} Lista de pistas
 */
function parseM3UPlaylist(content) {
  const lines = content.split('\n');
  const tracks = [];
  let currentTrack = {};
  
  for (let line of lines) {
    line = line.trim();
    if (line === '' || line.startsWith('#EXTM3U')) continue;
    
    if (line.startsWith('#EXTINF:')) {
      // Línea de información de pista
      const info = line.substring(8).split(',', 2);
      currentTrack = {
        id: crypto.randomUUID(),
        duration: parseInt(info[0]) || 0,
        name: info[1] || 'Pista desconocida',
        path: ''
      };
    } else if (!line.startsWith('#')) {
      // Línea de ruta de archivo
      if (Object.keys(currentTrack).length > 0) {
        currentTrack.path = line;
        tracks.push({...currentTrack});
        currentTrack = {};
      } else {
        // Si no hay información previa, crear una pista con nombre del archivo
        const fileName = line.split('/').pop().split('\\').pop();
        tracks.push({
          id: crypto.randomUUID(),
          name: fileName,
          path: line,
          duration: 0
        });
      }
    }
  }
  
  return tracks;
}

/**
 * Analiza una lista de reproducción en formato PLS
 * @param {string} content - Contenido del archivo PLS
 * @returns {Array} Lista de pistas
 */
function parsePLSPlaylist(content) {
  const lines = content.split('\n');
  const tracks = [];
  let trackCount = 0;
  const trackData = {};
  
  for (let line of lines) {
    line = line.trim();
    if (line === '' || line.startsWith('[playlist]')) continue;
    
    if (line.startsWith('NumberOfEntries=')) {
      trackCount = parseInt(line.split('=')[1]) || 0;
      continue;
    }
    
    // Formato: File1=ruta, Title1=título, Length1=duración
    const match = line.match(/^(File|Title|Length)(\d+)=(.*)$/i);
    if (match) {
      const [, type, numStr, value] = match;
      const num = parseInt(numStr);
      
      if (!trackData[num]) trackData[num] = {
        id: crypto.randomUUID(),
        path: '',
        name: `Pista ${num}`,
        duration: 0
      };
      
      switch (type.toLowerCase()) {
        case 'file':
          trackData[num].path = value;
          break;
        case 'title':
          trackData[num].name = value;
          break;
        case 'length':
          trackData[num].duration = parseInt(value) || 0;
          break;
      }
    }
  }
  
  // Convertir el objeto a un array
  for (let i = 1; i <= trackCount; i++) {
    if (trackData[i]) {
      tracks.push(trackData[i]);
    }
  }
  
  return tracks;
}

/**
 * Analiza una lista de reproducción en formato JSON
 * @param {string} content - Contenido del archivo JSON
 * @returns {Array} Lista de pistas
 */
function parseJSONPlaylist(content) {
  try {
    const data = JSON.parse(content);
    
    if (Array.isArray(data)) {
      // Array simple de pistas
      return data.map(track => ({
        id: track.id || crypto.randomUUID(),
        name: track.name || track.title || 'Pista sin título',
        artist: track.artist || '',
        album: track.album || '',
        path: track.path || track.url || '',
        duration: track.duration || 0
      }));
    } else if (data.tracks && Array.isArray(data.tracks)) {
      // Formato con metadatos y array de pistas
      return data.tracks.map(track => ({
        id: track.id || crypto.randomUUID(),
        name: track.name || track.title || 'Pista sin título',
        artist: track.artist || '',
        album: track.album || '',
        path: track.path || track.url || '',
        duration: track.duration || 0
      }));
    } else {
      throw new Error('Formato JSON no reconocido');
    }
  } catch (error) {
    console.error('Error al analizar JSON:', error);
    return [];
  }
}
