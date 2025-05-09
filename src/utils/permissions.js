// utils/permissions.js
// Solo speakers está habilitado, así que solo ejemplo de reproducción de audio
export function playSampleAudio() {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio('/sample.mp3');
      audio.oncanplaythrough = () => {
        audio.play();
        resolve('Audio reproduciéndose');
      };
      audio.onerror = () => reject('No se pudo reproducir el audio');
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Utilidad para gestionar permisos del sistema de archivos
 * Implementa funciones para solicitar y verificar permisos para File System Access API
 */
class PermissionsManager {
  constructor() {
    this.hasFileSystemAccess = 'showOpenFilePicker' in window;
    this.activePermissions = new Map();
  }

  /**
   * Verifica si la API de acceso al sistema de archivos está disponible
   */
  isFileSystemAccessSupported() {
    return this.hasFileSystemAccess;
  }
  
  /**
   * Solicita acceso a múltiples archivos de audio
   * @returns {Promise<Array<FileSystemFileHandle>>} Array de manejadores de archivos
   */
  async requestAudioFiles() {
    if (!this.hasFileSystemAccess) {
      throw new Error('La API File System Access no está disponible en este navegador');
    }
    
    try {
      const options = {
        types: [
          {
            description: 'Archivos de audio',
            accept: {
              'audio/*': ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac']
            }
          }
        ],
        excludeAcceptAllOption: false,
        multiple: true
      };
      
      const fileHandles = await window.showOpenFilePicker(options);
      return fileHandles;
    } catch (error) {
      if (error.name === 'AbortError') {
        // El usuario canceló la selección
        return [];
      }
      console.error('Error al solicitar archivos de audio:', error);
      throw error;
    }
  }
  
  /**
   * Solicita acceso a una carpeta
   * @returns {Promise<FileSystemDirectoryHandle>} Manejador de directorio
   */
  async requestMusicFolder() {
    if (!this.hasFileSystemAccess) {
      throw new Error('La API File System Access no está disponible en este navegador');
    }
    
    try {
      const options = {
        id: 'music-folder',
        mode: 'read',
        startIn: 'music'
      };
      
      const directoryHandle = await window.showDirectoryPicker(options);
      
      // Guardamos el permiso para uso futuro
      this.activePermissions.set('musicFolder', directoryHandle);
      
      return directoryHandle;
    } catch (error) {
      if (error.name === 'AbortError') {
        // El usuario canceló la selección
        return null;
      }
      console.error('Error al solicitar carpeta de música:', error);
      throw error;
    }
  }
  
  /**
   * Verifica el estado del permiso para un recurso
   * @param {FileSystemHandle} handle - Manejador del recurso del sistema de archivos
   * @returns {Promise<string>} Estado del permiso ('granted', 'prompt' o 'denied')
   */
  async checkPermission(handle) {
    if (!handle || typeof handle.queryPermission !== 'function') {
      return 'denied';
    }
    
    try {
      // Verificamos el estado actual del permiso
      const permission = await handle.queryPermission({ mode: 'read' });
      return permission;
    } catch (error) {
      console.error('Error al consultar permiso:', error);
      return 'denied';
    }
  }
  
  /**
   * Solicita permiso si es necesario
   * @param {FileSystemHandle} handle - Manejador del recurso del sistema de archivos
   * @returns {Promise<boolean>} Si se tiene permiso o no
   */
  async requestPermissionIfNeeded(handle) {
    if (!handle) return false;
    
    try {
      // Verificamos el estado actual
      let permission = await this.checkPermission(handle);
      
      // Si necesitamos solicitar permiso, lo hacemos
      if (permission !== 'granted') {
        permission = await handle.requestPermission({ mode: 'read' });
      }
      
      return permission === 'granted';
    } catch (error) {
      console.error('Error al solicitar permiso:', error);
      return false;
    }
  }
  
  /**
   * Guarda los permisos en localStorage para intentar restaurarlos después
   */
  async savePermissions() {
    // La API File System Access no permite guardar los handles directamente,
    // pero podemos usar la File System Access API Helpers cuando esté disponible
    console.log('La función de guardar permisos aún no está implementada');
    return false;
  }
  
  /**
   * Carga permisos previamente guardados
   */
  async loadPermissions() {
    console.log('La función de cargar permisos aún no está implementada');
    return false;
  }
  
  /**
   * Escanea una carpeta y devuelve todos los archivos de audio
   * @param {FileSystemDirectoryHandle} directoryHandle - Manejador de directorio
   * @param {boolean} recursive - Si debe buscar en subcarpetas
   * @returns {Promise<Array<Object>>} Array de objetos con handles de archivos y metadatos
   */
  async scanDirectoryForAudioFiles(directoryHandle, recursive = true) {
    if (!directoryHandle) {
      throw new Error('No se proporcionó un manejador de directorio');
    }
    
    const hasPermission = await this.requestPermissionIfNeeded(directoryHandle);
    
    if (!hasPermission) {
      throw new Error('No hay permiso para acceder al directorio');
    }
    
    const audioFiles = [];
    
    async function* getFilesRecursively(dir, path = '') {
      for await (const entry of dir.values()) {
        const entryPath = path ? `${path}/${entry.name}` : entry.name;
        
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          if (file.type.startsWith('audio/') || 
              file.name.endsWith('.mp3') || 
              file.name.endsWith('.flac') ||
              file.name.endsWith('.wav') ||
              file.name.endsWith('.ogg') ||
              file.name.endsWith('.m4a') ||
              file.name.endsWith('.aac')) {
            yield {
              handle: entry,
              path: entryPath,
              name: entry.name,
              type: file.type,
              size: file.size,
              lastModified: file.lastModified
            };
          }
        } else if (recursive && entry.kind === 'directory') {
          yield* getFilesRecursively(entry, entryPath);
        }
      }
    }
    
    for await (const fileInfo of getFilesRecursively(directoryHandle)) {
      audioFiles.push(fileInfo);
    }
    
    return audioFiles;
  }
  
  /**
   * Filtra los handles de archivo por extensiones de audio
   * @param {Array<FileSystemFileHandle>} fileHandles - Array de manejadores de archivo
   * @returns {Promise<Array<Object>>} Array de objetos con información de archivo
   */
  async filterAudioFiles(fileHandles) {
    if (!Array.isArray(fileHandles)) return [];
    
    const audioFiles = [];
    
    for (const handle of fileHandles) {
      try {
        const file = await handle.getFile();
        
        if (file.type.startsWith('audio/') || 
            file.name.endsWith('.mp3') || 
            file.name.endsWith('.flac') ||
            file.name.endsWith('.wav') ||
            file.name.endsWith('.ogg') ||
            file.name.endsWith('.m4a') ||
            file.name.endsWith('.aac')) {
          audioFiles.push({
            handle,
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
          });
        }
      } catch (error) {
        console.warn(`No se pudo acceder al archivo ${handle.name}:`, error);
      }
    }
    
    return audioFiles;
  }
}

// Exportamos una única instancia
const permissionsManager = new PermissionsManager();
export default permissionsManager;
