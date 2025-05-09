<template>
  <div class="lyrics-view">
    <h2>Letras</h2>
    
    <div v-if="!currentTrack" class="empty-state">
      <p>No hay ninguna canción reproduciéndose</p>
      <p class="hint">Reproduce una pista para ver su letra</p>
    </div>
    
    <div v-else class="lyrics-container">
      <div class="track-info">
        <div class="cover-container">
          <img v-if="currentTrack.coverUrl" :src="currentTrack.coverUrl" alt="Cover" class="track-cover" />
          <div v-else class="cover-placeholder"></div>
        </div>
        
        <div class="track-details">
          <h3>{{ currentTrack.name }}</h3>
          <p class="artist">{{ currentTrack.artist || 'Artista desconocido' }}</p>
          <p class="album">{{ currentTrack.album || 'Álbum desconocido' }}</p>
        </div>
      </div>
      
      <div class="lyrics-content">
        <div v-if="!lyrics" class="no-lyrics">
          <p>No hay letras disponibles para esta canción</p>
          <button @click="searchLyrics">Buscar letras</button>
          <button @click="importLyrics">Importar archivo LRC</button>
        </div>
        <div v-else>
          <div class="lyrics-actions">
            <button @click="toggleAutoScroll">
              {{ autoScroll ? 'Desactivar desplazamiento automático' : 'Activar desplazamiento automático' }}
            </button>
            <button @click="editLyrics">Editar</button>
          </div>
          
          <div v-if="!editMode" class="lyrics-text">
            <div 
              v-for="(line, index) in formattedLyrics" 
              :key="index"
              :class="{ 'active-line': currentLine === index }"
              ref="lyricsLines"
            >
              {{ line.text }}
            </div>
          </div>
          
          <div v-else class="lyrics-editor">
            <textarea 
              v-model="editingLyrics" 
              placeholder="Escribe o pega las letras aquí..."
              class="lyrics-textarea"
            ></textarea>
            <div class="editor-actions">
              <button @click="cancelEdit" class="cancel-button">Cancelar</button>
              <button @click="saveLyrics" class="save-button">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LyricsView',
  data() {
    return {
      currentTrack: null,
      lyrics: '',
      editingLyrics: '',
      editMode: false,
      autoScroll: true,
      currentLine: 0,
      formattedLyrics: []
    }
  },
  methods: {
    searchLyrics() {
      // Para implementar: Búsqueda de letras
      alert('Función de búsqueda de letras por implementar');
    },
    importLyrics() {
      // Para implementar: Importación de archivo LRC
      alert('Función de importación de letras por implementar');
    },
    toggleAutoScroll() {
      this.autoScroll = !this.autoScroll;
    },
    editLyrics() {
      this.editMode = true;
      this.editingLyrics = this.lyrics;
    },
    cancelEdit() {
      this.editMode = false;
      this.editingLyrics = '';
    },
    saveLyrics() {
      this.lyrics = this.editingLyrics;
      this.editMode = false;
      this.parseAndFormatLyrics();
      
      // Para implementar: Guardar las letras en el sistema
      console.log('Letras guardadas:', this.lyrics);
    },
    parseAndFormatLyrics() {
      // Implementación básica: simplemente dividir por líneas
      this.formattedLyrics = this.lyrics.split('\n').map(line => ({
        text: line,
        time: 0
      }));
    },
    scrollToActiveLine() {
      if (!this.autoScroll || !this.$refs.lyricsLines) return;
      
      const activeLine = this.$refs.lyricsLines[this.currentLine];
      if (activeLine) {
        activeLine.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  },
  mounted() {
    // Para demostración, añadimos una canción actual y letra de ejemplo
    this.currentTrack = {
      id: '123',
      name: 'Canción de ejemplo',
      artist: 'Artista de ejemplo',
      album: 'Álbum de ejemplo',
    };
    
    this.lyrics = `[00:00.00] Esta es una letra de ejemplo
[00:05.00] Para mostrar cómo se vería
[00:10.00] La funcionalidad de letras
[00:15.00] En nuestra aplicación de música
[00:20.00] 
[00:25.00] La sincronización de tiempo
[00:30.00] Aún no está implementada
[00:35.00] Pero se añadirá más adelante
[00:40.00] Para una mejor experiencia`;
    
    this.parseAndFormatLyrics();
    
    // Para simular el avance de la canción
    setInterval(() => {
      if (this.formattedLyrics.length > 0) {
        this.currentLine = (this.currentLine + 1) % this.formattedLyrics.length;
        this.scrollToActiveLine();
      }
    }, 5000);
  }
}
</script>

<style scoped>
.lyrics-view {
  padding: var(--space-md);
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  margin-bottom: var(--space-lg);
  color: var(--color-vaporwave4);
}

.empty-state {
  text-align: center;
  padding: var(--space-xl);
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.hint {
  color: var(--color-text-secondary);
  font-size: 0.9em;
}

.lyrics-container {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: var(--space-md);
}

.track-info {
  display: flex;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.cover-container {
  width: 100px;
  height: 100px;
  margin-right: var(--space-md);
}

.track-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--color-vaporwave5);
  border-radius: 4px;
}

.track-details {
  flex: 1;
}

.track-details h3 {
  margin: 0 0 var(--space-xs);
  color: var(--color-vaporwave4);
}

.artist, .album {
  margin: 0 0 var(--space-xs);
  color: var(--color-text-secondary);
}

.lyrics-content {
  padding: var(--space-md) 0;
}

.no-lyrics {
  text-align: center;
  padding: var(--space-lg) 0;
}

.lyrics-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.lyrics-text {
  line-height: 1.6;
  height: 400px;
  overflow-y: auto;
  padding: var(--space-md);
}

.active-line {
  color: var(--color-vaporwave4);
  font-weight: bold;
  font-size: 1.2em;
}

.lyrics-editor {
  margin-top: var(--space-md);
}

.lyrics-textarea {
  width: 100%;
  height: 300px;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid var(--color-vaporwave5);
  border-radius: 4px;
  padding: var(--space-md);
  resize: vertical;
  margin-bottom: var(--space-md);
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.cancel-button {
  background-color: transparent;
  border: 1px solid var(--color-vaporwave5);
}

.save-button {
  background-color: var(--color-vaporwave1);
}

button {
  padding: var(--space-xs) var(--space-md);
  background-color: var(--color-vaporwave5);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: var(--color-vaporwave1);
}
</style>