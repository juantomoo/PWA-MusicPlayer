import localforage from 'localforage';
import { getDirectoryHandle } from './permissions';

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
   * Carga las listas de reproducción guardadas y asegura que siempre haya una global
   */
  async loadPlaylists() {
    try {
      const savedPlaylists = await localforage.getItem('playlists');
      if (savedPlaylists && Array.isArray(savedPlaylists) && savedPlaylists.length > 0) {
        this.playlists = savedPlaylists;
        this.loaded = true;
        return this.playlists;
      } else {
        // Si no hay listas guardadas, crear una vacía
        this.playlists = [{
          id: `playlist_${Date.now()}`,
          name: 'Mi música',
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
   * Devuelve la playlist global (la única) desde almacenamiento local
   */
  async getGlobalPlaylist() {
    const playlists = await this.loadPlaylists();
    return playlists && playlists.length > 0 ? playlists[0] : null;
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

  /**
   * Rescans the playlists
   */
  async rescanPlaylists() {
    try {
      // Simulate rescanning playlists (replace with actual logic if needed)
      const playlists = await this.fetchPlaylistsFromLibrary();
      await localforage.setItem('playlists', playlists);
      return playlists;
    } catch (error) {
      console.error('Error rescanning playlists:', error);
      return [];
    }
  }

  /**
   * Fetches playlists from the library
   */
  async fetchPlaylistsFromLibrary() {
    // Placeholder for fetching playlists from the library
    return [
      { id: '1', name: 'Favoritos', tracks: [] },
      { id: '2', name: 'Recientes', tracks: [] },
    ];
  }

  /**
   * Selects a music directory
   */
  async selectMusicDirectory() {
    try {
      const directoryHandle = await window.showDirectoryPicker();
      await localforage.setItem('musicDirectory', directoryHandle);
      return directoryHandle;
    } catch (error) {
      console.error('Error selecting music directory:', error);
      return null;
    }
  }

  /**
   * Scans a music directory
   */
  async scanMusicDirectory(directoryHandle = null) {
    try {
      if (!directoryHandle) {
        directoryHandle = await localforage.getItem('musicDirectory');
        if (!directoryHandle) {
          console.warn('No music directory set');
          return;
        }
      }

      const playlists = await this.fetchPlaylistsFromDirectory(directoryHandle);
      await localforage.setItem('playlists', playlists);
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        console.error('Permiso denegado para acceder al directorio.');
      } else {
        console.error('Error inesperado al escanear el directorio:', error);
      }
      throw error;
    }
  }

  /**
   * Fetches playlists from a directory
   */
  async fetchPlaylistsFromDirectory(directoryHandle) {
    const playlists = [];
    for await (const entry of directoryHandle.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.mp3')) {
        const file = await entry.getFile();
        const metadata = await this.extractMetadata(file);
        playlists.push({
          id: metadata.id,
          name: metadata.title || entry.name,
          tracks: [{
            id: metadata.id,
            name: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
            fileHandle: entry,
          }],
        });
      }
    }
    return playlists;
  }

  /**
   * Extrae metadatos de un archivo de audio
   */
  async extractMetadata(fileOrHandle) {
    try {
      // Si es un FileSystemFileHandle, obtenemos el archivo
      const file = fileOrHandle.getFile ? await fileOrHandle.getFile() : fileOrHandle;
      
      // ID único para la pista
      const id = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Si window.jsmediatags está disponible (importado desde public/jsmediatags.min.js)
      if (window.jsmediatags) {
        return new Promise((resolve) => {
          window.jsmediatags.read(file, {
            onSuccess: (tag) => {
              const tags = tag.tags;
              let picture = '';
              
              // Extraer imagen de portada si existe
              if (tags.picture) {
                const { data, format } = tags.picture;
                let base64String = "";
                for (let i = 0; i < data.length; i++) {
                  base64String += String.fromCharCode(data[i]);
                }
                picture = `data:${format};base64,${window.btoa(base64String)}`;
              }
              
              resolve({
                id,
                title: tags.title || file.name,
                artist: tags.artist || 'Desconocido',
                album: tags.album || 'Desconocido',
                year: tags.year || '',
                coverArt: picture,
                fileHandle: fileOrHandle
              });
            },
            onError: () => {
              // En caso de error, devolvemos metadatos básicos
              resolve({
                id,
                title: file.name,
                artist: 'Desconocido',
                album: 'Desconocido',
                coverArt: '',
                fileHandle: fileOrHandle
              });
            }
          });
        });
      } else {
        // Si jsmediatags no está disponible, devolvemos metadatos básicos
        return {
          id,
          title: file.name,
          artist: 'Desconocido',
          album: 'Desconocido',
          coverArt: '',
          fileHandle: fileOrHandle
        };
      }
    } catch (error) {
      console.error('Error al extraer metadatos:', error);
      const id = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id,
        title: fileOrHandle.name || 'Desconocido',
        artist: 'Desconocido',
        album: 'Desconocido',
        coverArt: '',
        fileHandle: fileOrHandle
      };
    }
  }

  /**
   * Escanea el directorio seleccionado y crea una sola playlist con todas las pistas encontradas
   */
  async selectAndScanMusicDirectory() {
    try {
      console.log('Solicitando directorio de música...');
      const directoryHandle = await getDirectoryHandle();
      console.log('Directorio seleccionado:', directoryHandle.name);

      // Verificar y solicitar permisos persistentes
      console.log('Verificando permisos...');
      const permission = await directoryHandle.queryPermission({ mode: 'read' });
      if (permission !== 'granted') {
        console.log('Solicitando permisos...');
        const requestPermission = await directoryHandle.requestPermission({ mode: 'read' });
        if (requestPermission !== 'granted') {
          throw new Error('Permiso denegado para acceder al directorio.');
        }
      }
      console.log('Permisos concedidos');

      // Almacenar el directorio seleccionado
      await localforage.setItem('musicDirectory', directoryHandle);
      console.log('Directorio guardado en localforage');

      // Recorrer recursivamente el directorio y subdirectorios para recolectar todas las pistas
      const allTracks = [];
      async function scanDir(dirHandle) {
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.mp3')) {
            try {
              const metadata = await playlistManager.extractMetadata(entry);
              allTracks.push({
                id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: metadata.title || entry.name.replace('.mp3', ''),
                artist: metadata.artist || 'Desconocido',
                album: metadata.album || 'Desconocido',
                coverArt: metadata.coverArt || '',
                fileHandle: entry
              });
            } catch (fileError) {
              console.error(`Error procesando archivo ${entry.name}:`, fileError);
            }
          } else if (entry.kind === 'directory') {
            await scanDir(entry);
          }
        }
      }
      await scanDir(directoryHandle);

      // Crear una sola playlist con todas las pistas
      const playlist = {
        id: `playlist_${Date.now()}`,
        name: directoryHandle.name || 'Mi música',
        tracks: allTracks
      };

      // Guardar la playlist como única en almacenamiento local
      const playlists = [playlist];
      await localforage.setItem('playlists', playlists);

      return playlists;
    } catch (error) {
      console.error('Error al seleccionar y escanear el directorio:', error);
      throw error;
    }
  }

  /**
   * Extrae metadatos ID3 de una pista
   */
  extractID3Metadata(track) {
    return new Promise((resolve) => {
      window.jsmediatags.read(track.file, {
        onSuccess: (tag) => {
          const { title, artist, album, picture } = tag.tags;
          track.name = title || track.name;
          track.artist = artist || 'Desconocido';
          track.album = album || 'Desconocido';
          if (picture) {
            const base64String = picture.data.reduce((data, byte) => data + String.fromCharCode(byte), '');
            track.coverUrl = `data:${picture.format};base64,${btoa(base64String)}`;
          }
          resolve(track);
        },
        onError: () => resolve(track),
      });
    });
  }

  /**
   * Obtiene el directorio de música guardado
   */
  async getMusicDirectory() {
    try {
      const directoryHandle = await localforage.getItem('musicDirectory');
      
      if (directoryHandle) {
        // Verificar permisos para el directorio guardado
        const permission = await directoryHandle.queryPermission({ mode: 'read' });
        
        if (permission !== 'granted') {
          console.log('Solicitando permiso para acceder al directorio guardado...');
          const requestPermission = await directoryHandle.requestPermission({ mode: 'read' });
          
          if (requestPermission !== 'granted') {
            console.warn('Permiso denegado para el directorio guardado');
            return null;
          }
        }
        
        return directoryHandle;
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener el directorio de música:', error);
      return null;
    }
  }

  /**
   * Actualiza una playlist existente
   */
  async updatePlaylist(playlist) {
    if (!playlist || !playlist.id) return false;
    
    const index = this.playlists.findIndex(p => p.id === playlist.id);
    if (index === -1) return false;
    
    this.playlists[index] = playlist;
    await this.savePlaylists();
    return true;
  }
}

// Exportamos una sola instancia
const playlistManager = new PlaylistManager();
export default playlistManager;
