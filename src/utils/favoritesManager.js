import localforage from 'localforage';

/**
 * Utilidad para gestionar canciones favoritas
 * Implementa funciones para guardar, recuperar y eliminar canciones favoritas
 */
class FavoritesManager {
  constructor() {
    this.storageKey = 'pwa_music_favorites';
    this.favorites = new Map();
    
    // Inicializamos localforage para favoritos
    this.storage = localforage.createInstance({
      name: 'PWAMusicPlayer',
      storeName: 'favorites'
    });
    
    // Cargamos favoritos cuando se instancia la clase
    this.loadFavorites();
  }
  
  /**
   * Carga las canciones favoritas desde el almacenamiento
   */
  async loadFavorites() {
    try {
      const favorites = await this.storage.getItem(this.storageKey);
      if (favorites && Array.isArray(favorites)) {
        // Convertimos el array en un Map para búsqueda más rápida
        this.favorites = new Map(
          favorites.map(item => [item.id, item])
        );
      }
      return Array.from(this.favorites.values());
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
      return [];
    }
  }
  
  /**
   * Guarda el estado actual de favoritos en el almacenamiento
   */
  async saveFavorites() {
    try {
      const favoritesArray = Array.from(this.favorites.values());
      await this.storage.setItem(this.storageKey, favoritesArray);
      return true;
    } catch (error) {
      console.error('Error al guardar favoritos:', error);
      return false;
    }
  }
  
  /**
   * Obtiene todas las canciones favoritas
   * @returns {Array<Object>} Array de canciones favoritas
   */
  getAllFavorites() {
    return Array.from(this.favorites.values());
  }
  
  /**
   * Verifica si una canción está en favoritos
   * @param {string} songId - ID único de la canción
   * @returns {boolean} true si está en favoritos
   */
  isFavorite(songId) {
    return this.favorites.has(songId);
  }
  
  /**
   * Agrega una canción a favoritos
   * @param {Object} song - Objeto con información de la canción
   * @returns {Promise<boolean>} Resultado de la operación
   */
  async addFavorite(song) {
    if (!song || !song.id) {
      console.error('Se intentó agregar una canción sin ID a favoritos');
      return false;
    }
    
    // Agregamos metadatos sobre cuándo se agregó a favoritos
    const songWithMeta = {
      ...song,
      addedToFavoritesAt: new Date().toISOString()
    };
    
    this.favorites.set(song.id, songWithMeta);
    return await this.saveFavorites();
  }
  
  /**
   * Elimina una canción de favoritos
   * @param {string} songId - ID único de la canción
   * @returns {Promise<boolean>} Resultado de la operación
   */
  async removeFavorite(songId) {
    if (!songId || !this.favorites.has(songId)) {
      return false;
    }
    
    this.favorites.delete(songId);
    return await this.saveFavorites();
  }
  
  /**
   * Alterna el estado de favorito de una canción
   * @param {Object} song - Objeto con información de la canción
   * @returns {Promise<boolean>} Estado final (true=favorito, false=no favorito)
   */
  async toggleFavorite(song) {
    if (!song || !song.id) {
      console.error('Se intentó alternar una canción sin ID en favoritos');
      return false;
    }
    
    const isFavorite = this.isFavorite(song.id);
    
    if (isFavorite) {
      await this.removeFavorite(song.id);
      return false;
    } else {
      await this.addFavorite(song);
      return true;
    }
  }
  
  /**
   * Limpia todos los favoritos
   * @returns {Promise<boolean>} Resultado de la operación
   */
  async clearAllFavorites() {
    try {
      this.favorites.clear();
      await this.storage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Error al borrar favoritos:', error);
      return false;
    }
  }
}

// Exportamos una única instancia
const favoritesManager = new FavoritesManager();
export default favoritesManager;
