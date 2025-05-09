/**
 * Extraer géneros únicos de una lista de pistas
 * @param {Array} tracks Lista de pistas a analizar
 * @returns {Array} Lista de géneros únicos
 */
function extractGenres(tracks) {
  if (!tracks || !tracks.length) return [];
  
  // Extraer todos los géneros y filtrar únicos
  return [...new Set(
    tracks
      .map(track => track.genre)
      .filter(genre => genre && genre.trim() !== '')
  )].sort();
}

/**
 * Extraer años únicos de una lista de pistas
 * @param {Array} tracks Lista de pistas a analizar
 * @returns {Array} Lista de años únicos
 */
function extractYears(tracks) {
  if (!tracks || !tracks.length) return [];
  
  // Extraer todos los años y filtrar únicos
  return [...new Set(
    tracks
      .map(track => {
        // Intentar extraer el año de diferentes propiedades
        if (track.year) return track.year;
        if (track.date) return String(track.date).substring(0, 4);
        return null;
      })
      .filter(year => year && String(year).trim() !== '')
  )].sort((a, b) => b - a); // Ordenar descendente (más recientes primero)
}

/**
 * Extraer artistas únicos de una lista de pistas
 * @param {Array} tracks Lista de pistas a analizar
 * @returns {Array} Lista de artistas únicos
 */
function extractArtists(tracks) {
  if (!tracks || !tracks.length) return [];
  
  // Extraer todos los artistas y filtrar únicos
  return [...new Set(
    tracks
      .map(track => track.artist)
      .filter(artist => artist && artist.trim() !== '')
  )].sort();
}

/**
 * Extraer álbumes únicos de una lista de pistas
 * @param {Array} tracks Lista de pistas a analizar
 * @returns {Array} Lista de álbumes únicos
 */
function extractAlbums(tracks) {
  if (!tracks || !tracks.length) return [];
  
  // Extraer todos los álbumes y filtrar únicos
  return [...new Set(
    tracks
      .map(track => track.album)
      .filter(album => album && album.trim() !== '')
  )].sort();
}

/**
 * Filtrar pistas por criterios múltiples
 * @param {Array} tracks Lista de pistas a filtrar
 * @param {Object} filters Criterios de filtrado
 * @returns {Array} Pistas filtradas
 */
function filterTracks(tracks, filters = {}) {
  if (!tracks || !tracks.length) return [];
  if (!filters || Object.keys(filters).length === 0) return [...tracks];
  
  return tracks.filter(track => {
    // Aplicar cada filtro activo
    let matchesAllFilters = true;
    
    // Filtrar por texto de búsqueda
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const titleMatch = track.title && track.title.toLowerCase().includes(searchLower);
      const artistMatch = track.artist && track.artist.toLowerCase().includes(searchLower);
      const albumMatch = track.album && track.album.toLowerCase().includes(searchLower);
      
      if (!(titleMatch || artistMatch || albumMatch)) {
        matchesAllFilters = false;
      }
    }
    
    // Filtrar por género
    if (filters.genre && track.genre !== filters.genre) {
      matchesAllFilters = false;
    }
    
    // Filtrar por año
    if (filters.year) {
      const trackYear = track.year || (track.date ? String(track.date).substring(0, 4) : null);
      if (trackYear !== filters.year) {
        matchesAllFilters = false;
      }
    }
    
    // Filtrar por artista
    if (filters.artist && track.artist !== filters.artist) {
      matchesAllFilters = false;
    }
    
    // Filtrar por álbum
    if (filters.album && track.album !== filters.album) {
      matchesAllFilters = false;
    }
    
    return matchesAllFilters;
  });
}

/**
 * Ordenar pistas por un criterio específico
 * @param {Array} tracks Lista de pistas a ordenar
 * @param {string} sortBy Criterio de ordenación ('title', 'artist', 'album', 'year')
 * @param {boolean} ascending Orden ascendente o descendente
 * @returns {Array} Pistas ordenadas
 */
function sortTracks(tracks, sortBy = 'title', ascending = true) {
  if (!tracks || !tracks.length) return [];
  
  const sortFactor = ascending ? 1 : -1;
  
  return [...tracks].sort((a, b) => {
    let valueA, valueB;
    
    switch (sortBy) {
      case 'artist':
        valueA = a.artist || '';
        valueB = b.artist || '';
        break;
      case 'album':
        valueA = a.album || '';
        valueB = b.album || '';
        break;
      case 'year':
        valueA = a.year || (a.date ? String(a.date).substring(0, 4) : '');
        valueB = b.year || (b.date ? String(b.date).substring(0, 4) : '');
        break;
      case 'title':
      default:
        valueA = a.title || '';
        valueB = b.title || '';
    }
    
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortFactor * valueA.localeCompare(valueB);
    } else {
      return sortFactor * (valueA > valueB ? 1 : valueA < valueB ? -1 : 0);
    }
  });
}

export {
  extractGenres,
  extractYears,
  extractArtists,
  extractAlbums,
  filterTracks,
  sortTracks
};
