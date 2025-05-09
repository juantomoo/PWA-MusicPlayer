// Gestor de favoritos para el reproductor de música
const FAVORITES_KEY = 'pwa-music-player-favorites';

/**
 * Guarda la lista de favoritos en el almacenamiento local
 * @param {Array} favorites - Lista de pistas favoritas
 */
export function saveFavorites(favorites) {
  if (!Array.isArray(favorites)) {
    console.warn('saveFavorites: El parámetro no es un array válido');
    return false;
  }

  try {
    // Crear versión simplificada para almacenamiento
    const simplifiedFavorites = favorites.map(track => ({
      id: track.id,
      name: track.name || track.title,
      artist: track.artist || 'Desconocido',
      album: track.album || 'Desconocido',
      favorite: true,
      // Otros metadatos relevantes pero ligeros
      year: track.year || '',
      genre: track.genre || '',
      // No guardamos el archivo completo, solo una referencia
      filePath: track.filePath || ''
    }));
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(simplifiedFavorites));
    return true;
  } catch (error) {
    console.error('Error al guardar favoritos:', error);
    return false;
  }
}

/**
 * Carga la lista de favoritos desde el almacenamiento local
 * @returns {Array} Lista de pistas favoritas
 */
export function loadFavorites() {
  try {
    const storedFavorites = localStorage.getItem(FAVORITES_KEY);
    if (storedFavorites) {
      const favorites = JSON.parse(storedFavorites);
      
      if (Array.isArray(favorites)) {
        return favorites.map(track => ({
          ...track,
          favorite: true
        }));
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error al cargar favoritos:', error);
    return [];
  }
}

/**
 * Añade una pista a favoritos
 * @param {Object} track - Pista a añadir
 * @param {Array} favorites - Lista actual de favoritos (opcional)
 * @returns {Array} Nueva lista de favoritos
 */
export function addFavorite(track, favorites = []) {
  if (!track || !track.id) {
    console.warn('addFavorite: Pista no válida');
    return favorites;
  }
  
  // Verificar si ya existe
  if (favorites.some(fav => fav.id === track.id)) {
    return favorites;
  }
  
  // Añadir a favoritos
  const updatedTrack = { ...track, favorite: true };
  const updatedFavorites = [...favorites, updatedTrack];
  
  // Guardar cambios
  saveFavorites(updatedFavorites);
  
  return updatedFavorites;
}

/**
 * Elimina una pista de favoritos
 * @param {string} trackId - ID de la pista a eliminar
 * @param {Array} favorites - Lista actual de favoritos
 * @returns {Array} Nueva lista de favoritos
 */
export function removeFavorite(trackId, favorites = []) {
  if (!trackId) {
    console.warn('removeFavorite: ID de pista no válido');
    return favorites;
  }
  
  const updatedFavorites = favorites.filter(track => track.id !== trackId);
  
  if (updatedFavorites.length !== favorites.length) {
    // Si hubo cambios, guardar
    saveFavorites(updatedFavorites);
  }
  
  return updatedFavorites;
}

/**
 * Comprueba si una pista está marcada como favorita
 * @param {Object|string} trackOrId - Pista o ID de pista
 * @param {Array} favorites - Lista actual de favoritos
 * @returns {boolean} true si es favorita, false si no
 */
export function isFavorite(trackOrId, favorites = []) {
  if (!trackOrId) return false;
  
  const trackId = typeof trackOrId === 'string' ? trackOrId : trackOrId.id;
  
  return favorites.some(fav => fav.id === trackId);
}

/**
 * Exporta lista de favoritos como archivo JSON
 * @param {Array} favorites - Lista de favoritos
 * @returns {Promise<boolean>} true si se exportó correctamente, false si no
 */
export async function exportFavorites(favorites) {
  try {
    const data = JSON.stringify(favorites, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mis_favoritos.json';
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error al exportar favoritos:', error);
    return false;
  }
}

/**
 * Importa lista de favoritos desde archivo JSON
 * @param {File} file - Archivo JSON
 * @returns {Promise<Array>} Lista de favoritos importados
 */
export async function importFavorites(file) {
  try {
    const text = await file.text();
    const imported = JSON.parse(text);
    
    if (Array.isArray(imported)) {
      const favorites = imported.map(track => ({
        ...track,
        favorite: true,
        id: track.id || crypto.randomUUID()
      }));
      
      saveFavorites(favorites);
      return favorites;
    } else {
      throw new Error('Formato de archivo no válido');
    }
  } catch (error) {
    console.error('Error al importar favoritos:', error);
    return [];
  }
}

export default {
  saveFavorites,
  loadFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  exportFavorites,
  importFavorites
};
