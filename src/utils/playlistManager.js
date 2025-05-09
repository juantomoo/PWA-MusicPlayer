import localforage from 'localforage';

// Configuración de localforage para playlists
localforage.config({
  name: 'PWA Music Player',
  storeName: 'playlists_store'
});

/**
 * Gestor de listas de reproducción
 * Maneja la creación, edición y persistencia de listas de reproducción
 */
class PlaylistManager {
  constructor() {
    this.playlists = [];
    this.loaded = false;
  }
  
  /**
   * Carga las listas de reproducción guardadas
   */
  async loadPlaylists() {
    try {
      const savedPlaylists = await localforage.getItem('playlists');
      
      if (savedPlaylists && Array.isArray(savedPlaylists)) {
        this.playlists = savedPlaylists;
        this.loaded = true;
        return this.playlists;
      } else {
        // Si no hay listas guardadas, creamos una por defecto
        this.playlists = [{
          id: 'favorites',
          name: 'Favoritos',
          tracks: []
        }];
        this.loaded = true;
        await this.savePlaylists();
        return this.playlists;
      }
    } catch (error) {
      console.error('Error al cargar listas de reproducción:', error);
      return [];
    }
  }
  
  /**
   * Guarda las listas de reproducción
   */
  async savePlaylists() {
    try {
      await localforage.setItem('playlists', this.playlists);
      return true;
    } catch (error) {
      console.error('Error al guardar listas de reproducción:', error);
      return false;
    }
  }
  
  /**
   * Obtiene todas las listas de reproducción
   */
  async getPlaylists() {
    if (!this.loaded) {
      await this.loadPlaylists();
    }
    return this.playlists;
  }
  
  /**
   * Obtiene una lista de reproducción por su ID
   */
  async getPlaylist(playlistId) {
    if (!this.loaded) {
      await this.loadPlaylists();
    }
    return this.playlists.find(p => p.id === playlistId) || null;
  }
  
  /**
   * Crea una nueva lista de reproducción
   */
  async createPlaylist(name) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new Error('El nombre de la lista no puede estar vacío');
    }
    
    if (!this.loaded) {
      await this.loadPlaylists();
    }
    
    const newPlaylist = {
      id: `playlist_${Date.now()}`,
      name: name.trim(),
      tracks: [],
      created: new Date().toISOString()
    };
    
    this.playlists.push(newPlaylist);
    await this.savePlaylists();
    
    return newPlaylist;
  }
  
  /**
   * Actualiza una lista de reproducción existente
   */
  async updatePlaylist(playlistId, updates) {
    if (!this.loaded) {
      await this.loadPlaylists();
    }
    
    const index = this.playlists.findIndex(p => p.id === playlistId);
    
    if (index === -1) {
      throw new Error(`No se encontró una lista con ID ${playlistId}`);
    }
    
    // Actualizamos solo los campos permitidos
    if (updates.name && typeof updates.name === 'string' && updates.name.trim()) {
      this.playlists[index].name = updates.name.trim();
    }
    
    if (Array.isArray(updates.tracks)) {
      this.playlists[index].tracks = updates.tracks;
    }
    
    this.playlists[index].updated = new Date().toISOString();
    
    await this.savePlaylists();
    return this.playlists[index];
  }
  
  /**
   * Elimina una lista de reproducción
   */
  async deletePlaylist(playlistId) {
    if (!this.loaded) {
      await this.loadPlaylists();
    }
    
    // No permitimos eliminar la lista de favoritos
    if (playlistId === 'favorites') {
      throw new Error('No se puede eliminar la lista de favoritos');
    }
    
    const initialLength = this.playlists.length;
    this.playlists = this.playlists.filter(p => p.id !== playlistId);
    
    if (this.playlists.length === initialLength) {
      throw new Error(`No se encontró una lista con ID ${playlistId}`);
    }
    
    await this.savePlaylists();
    return true;
  }
  
  /**
   * Añade una pista a una lista de reproducción
   */
  async addTrackToPlaylist(playlistId, track) {
    if (!track || !track.id) {
      throw new Error('La pista no es válida');
    }
    
    if (!this.loaded) {
      await this.loadPlaylists();
    }
    
    const playlist = this.playlists.find(p => p.id === playlistId);
    
    if (!playlist) {
      throw new Error(`No se encontró una lista con ID ${playlistId}`);
    }
    
    // Verificamos si la pista ya está en la lista
    if (playlist.tracks.some(t => t.id === track.id)) {
      return playlist; // La pista ya está en la lista
    }
    
    playlist.tracks.push(track);
    playlist.updated = new Date().toISOString();
    
    await this.savePlaylists();
    return playlist;
  }
  
  /**
   * Elimina una pista de una lista de reproducción
   */
  async removeTrackFromPlaylist(playlistId, trackId) {
    if (!this.loaded) {
      await this.loadPlaylists();
    }
    
    const playlist = this.playlists.find(p => p.id === playlistId);
    
    if (!playlist) {
      throw new Error(`No se encontró una lista con ID ${playlistId}`);
    }
    
    const initialLength = playlist.tracks.length;
    playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
    
    if (playlist.tracks.length === initialLength) {
      throw new Error(`La pista con ID ${trackId} no está en la lista`);
    }
    
    playlist.updated = new Date().toISOString();
    await this.savePlaylists();
    
    return playlist;
  }
  
  /**
   * Reordena las pistas de una lista de reproducción
   */
  async reorderPlaylistTracks(playlistId, newOrder) {
    if (!this.loaded) {
      await this.loadPlaylists();
    }
    
    const playlist = this.playlists.find(p => p.id === playlistId);
    
    if (!playlist) {
      throw new Error(`No se encontró una lista con ID ${playlistId}`);
    }
    
    if (!Array.isArray(newOrder) || 
        newOrder.length !== playlist.tracks.length || 
        !newOrder.every(i => typeof i === 'number' && i >= 0 && i < playlist.tracks.length)) {
      throw new Error('El nuevo orden no es válido');
    }
    
    // Reordenamos las pistas según el nuevo orden
    const reorderedTracks = newOrder.map(i => playlist.tracks[i]);
    playlist.tracks = reorderedTracks;
    playlist.updated = new Date().toISOString();
    
    await this.savePlaylists();
    return playlist;
  }
  
  /**
   * Exporta una lista de reproducción a formato M3U
   */
  async exportPlaylistToM3U(playlist) {
    if (!playlist || !Array.isArray(playlist.tracks)) {
      throw new Error('La lista de reproducción no es válida');
    }
    
    let m3uContent = '#EXTM3U\n';
    
    playlist.tracks.forEach(track => {
      m3uContent += `#EXTINF:${track.duration || -1},${track.artist || 'Unknown'} - ${track.name || 'Unknown'}\n`;
      m3uContent += `${track.filePath || track.url || ''}\n`;
    });
    
    return m3uContent;
  }
  
  /**
   * Importa una lista de reproducción desde formato M3U
   * Nota: Requiere acceso a los archivos para verificar que existan
   */
  async importPlaylistFromM3U(name, content, resolveFilePaths) {
    if (!name || !content) {
      throw new Error('Nombre y contenido son requeridos');
    }
    
    try {
      const lines = content.split('\n');
      const tracks = [];
      let currentTrack = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line || line.startsWith('#EXTM3U')) {
          continue;
        }
        
        if (line.startsWith('#EXTINF:')) {
          // Formato: #EXTINF:duración,artista - título
          const infoMatch = line.match(/#EXTINF:([^,]*),(.*)/);
          
          if (infoMatch) {
            const [, durationStr, title] = infoMatch;
            const duration = parseFloat(durationStr) || 0;
            let artist = '';
            let trackName = title;
            
            // Intentamos separar artista y título
            const titleParts = title.split(' - ');
            if (titleParts.length > 1) {
              artist = titleParts[0];
              trackName = titleParts.slice(1).join(' - ');
            }
            
            currentTrack = {
              name: trackName,
              artist,
              duration
            };
          }
        } else if (line && currentTrack) {
          // Esta línea contiene la ruta del archivo
          currentTrack.filePath = line;
          
          // Si se proporciona una función para resolver rutas, la usamos
          if (typeof resolveFilePaths === 'function') {
            try {
              const resolvedTrack = await resolveFilePaths(currentTrack);
              if (resolvedTrack) {
                tracks.push(resolvedTrack);
              }
            } catch (err) {
              console.warn('No se pudo resolver el archivo:', line, err);
            }
          } else {
            // Si no hay función para resolver, añadimos el track tal cual
            currentTrack.id = `imported_${Date.now()}_${tracks.length}`;
            tracks.push(currentTrack);
          }
          
          currentTrack = null;
        }
      }
      
      // Creamos la nueva lista de reproducción
      const newPlaylist = await this.createPlaylist(name);
      
      // Actualizamos con las pistas importadas
      newPlaylist.tracks = tracks;
      newPlaylist.imported = true;
      newPlaylist.importDate = new Date().toISOString();
      
      await this.savePlaylists();
      return newPlaylist;
    } catch (error) {
      console.error('Error al importar playlist M3U:', error);
      throw new Error(`Error al importar: ${error.message}`);
    }
  }
  
  /**
   * Analiza una lista de reproducción en formato JSON
   * @param {string} content - Contenido del archivo JSON
   * @returns {Array} Lista de pistas
   */
  async parseJSONPlaylist(content, name) {
    try {
      const data = JSON.parse(content);
      let tracks = [];
      
      if (Array.isArray(data)) {
        // Array simple de pistas
        tracks = data.map(track => ({
          id: track.id || `imported_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: track.name || track.title || 'Pista sin título',
          artist: track.artist || '',
          album: track.album || '',
          filePath: track.path || track.url || track.filePath || '',
          duration: track.duration || 0
        }));
      } else if (data.tracks && Array.isArray(data.tracks)) {
        // Formato con metadatos y array de pistas
        tracks = data.tracks.map(track => ({
          id: track.id || `imported_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: track.name || track.title || 'Pista sin título',
          artist: track.artist || '',
          album: track.album || '',
          filePath: track.path || track.url || track.filePath || '',
          duration: track.duration || 0
        }));
        
        // Si hay nombre en los metadatos, lo usamos
        if (data.name && !name) {
          name = data.name;
        }
      } else {
        throw new Error('Formato JSON no reconocido');
      }
      
      // Creamos la nueva lista de reproducción
      const newPlaylist = await this.createPlaylist(name || 'Lista importada');
      
      // Actualizamos con las pistas importadas
      newPlaylist.tracks = tracks;
      newPlaylist.imported = true;
      newPlaylist.importDate = new Date().toISOString();
      
      await this.savePlaylists();
      return newPlaylist;
    } catch (error) {
      console.error('Error al analizar JSON:', error);
      throw new Error(`Error al importar: ${error.message}`);
    }
  }
}

// Exportamos una sola instancia
const playlistManager = new PlaylistManager();
export default playlistManager;
