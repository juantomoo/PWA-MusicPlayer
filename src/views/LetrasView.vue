<template>
  <div class="p-3 flex flex-col h-full">
    <h1 class="text-2xl font-bold text-vaporwave4 mb-4">Letras</h1>

    <div v-if="store.currentTrack" class="flex flex-col flex-grow">
      <!-- Información de la canción -->
      <div class="mb-4 bg-vaporwave3/60 p-3 border border-vaporwave5/40">
        <h2 class="text-lg font-semibold text-vaporwave4">{{ store.currentTrack.name }}</h2>
        <p class="text-sm text-vaporwave1">{{ store.currentTrack.artist || 'Artista desconocido' }}</p>
      </div>

      <!-- Sección de búsqueda de letras -->
      <div class="flex items-center gap-2 mb-4">
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Buscar letras en línea..."
          class="flex-grow bg-vaporwave3 text-vaporwave4 border border-vaporwave4/40 px-3 py-2"
          @keyup.enter="searchLyrics"
        />
        <button 
          @click="searchLyrics"
          class="bg-vaporwave5 hover:bg-vaporwave5/80 text-white px-4 py-2 transition"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Buscando...' : 'Buscar' }}
        </button>
        <button 
          v-if="lyrics"
          @click="saveLyrics"
          class="bg-vaporwave2 hover:bg-vaporwave2/80 text-white px-3 py-2 transition"
          title="Guardar letras para esta canción"
        >
          💾
        </button>
      </div>

      <!-- Editor de letras -->
      <div 
        v-if="editMode"
        class="flex flex-col gap-3 flex-grow"
      >
        <div class="flex justify-between items-center">
          <h3 class="text-vaporwave1">Editor de letras</h3>
          <div class="flex gap-2">
            <button 
              @click="saveLyricsEdit"
              class="bg-vaporwave2 hover:bg-vaporwave2/80 text-white px-3 py-1 text-sm"
            >
              Guardar
            </button>
            <button 
              @click="cancelEdit"
              class="bg-vaporwave5/70 hover:bg-vaporwave5/50 text-white px-3 py-1 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
        <textarea 
          v-model="editLyrics"
          class="flex-grow bg-vaporwave3/50 text-vaporwave4 border border-vaporwave5/50 p-3 resize-none"
          placeholder="Escribe o pega las letras aquí..."
        ></textarea>
      </div>

      <!-- Visualización de letras -->
      <div 
        v-else-if="lyrics"
        class="bg-vaporwave3/30 p-4 border border-vaporwave5/40 flex-grow overflow-y-auto custom-scrollbar-vaporwave relative"
      >
        <div class="absolute top-2 right-2 flex gap-1">
          <button 
            @click="startEdit"
            class="bg-vaporwave3/70 hover:bg-vaporwave3 text-vaporwave4 p-1 w-8 h-8 flex items-center justify-center"
            title="Editar letras"
          >
            ✏️
          </button>
        </div>
        <div 
          class="lyrics-content whitespace-pre-wrap text-vaporwave1 mt-4"
          v-html="formattedLyrics"
        ></div>
      </div>

      <!-- Estado de carga -->
      <div v-else-if="isLoading" class="flex-grow flex justify-center items-center">
        <div class="text-vaporwave4">
          <p>Buscando letras...</p>
          <div class="mt-3 h-1 w-40 bg-vaporwave3/50">
            <div class="h-full bg-vaporwave5 loading-bar"></div>
          </div>
        </div>
      </div>

      <!-- Sin letras -->
      <div v-else class="flex-grow flex flex-col justify-center items-center text-center bg-vaporwave3/30 p-6">
        <p class="text-vaporwave1 mb-3">No hay letras disponibles para esta canción</p>
        <p class="text-sm text-vaporwave4 mb-4">
          Busca las letras en línea o edítalas manualmente
        </p>
        <button 
          @click="startEdit"
          class="bg-vaporwave5 hover:bg-vaporwave5/80 text-white px-4 py-2 transition"
        >
          Añadir letras manualmente
        </button>
      </div>
    </div>

    <!-- Sin canción seleccionada -->
    <div v-else class="flex-grow flex flex-col justify-center items-center text-center bg-vaporwave3/30 p-6">
      <p class="text-vaporwave1 mb-2">No hay canción reproduciéndose</p>
      <p class="text-sm text-vaporwave4">
        Selecciona una canción para ver sus letras
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { usePlayerStore } from '../store/playerStore';

const store = usePlayerStore();
const lyrics = ref('');
const editLyrics = ref('');
const editMode = ref(false);
const isLoading = ref(false);
const searchQuery = ref('');

// Para simular la base de datos local de letras
const lyricsDB = ref({});

// Cargar letras cuando cambie la canción
watch(() => store.currentTrack, async (newTrack) => {
  if (newTrack) {
    // Reiniciar estado
    lyrics.value = '';
    editMode.value = false;
    
    // Establecer consulta de búsqueda predeterminada
    searchQuery.value = `${newTrack.artist || ''} ${newTrack.name || ''}`.trim();
    
    // Verificar si ya tenemos letras almacenadas
    const trackId = newTrack.id || '';
    if (lyricsDB.value[trackId]) {
      lyrics.value = lyricsDB.value[trackId];
    }
  }
}, { immediate: true });

onMounted(() => {
  // Cargar letras guardadas desde localStorage
  try {
    const savedLyrics = localStorage.getItem('vaporwave_player_lyrics');
    if (savedLyrics) {
      lyricsDB.value = JSON.parse(savedLyrics);
      
      // Si hay una canción actual, intenta cargar sus letras
      if (store.currentTrack?.id && lyricsDB.value[store.currentTrack.id]) {
        lyrics.value = lyricsDB.value[store.currentTrack.id];
      }
    }
  } catch (error) {
    console.error('Error cargando letras guardadas:', error);
  }
});

// Buscar letras en línea (simulado)
async function searchLyrics() {
  if (!searchQuery.value.trim() || isLoading.value) return;
  
  isLoading.value = true;
  
  try {
    // Simulamos una búsqueda en línea con un retardo
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // En una implementación real, aquí se haría una petición a una API de letras
    // const response = await fetch(`https://api.lyrics.com/search?q=${encodeURIComponent(searchQuery.value)}`);
    // const data = await response.json();
    
    // Para la simulación, generamos unas letras de ejemplo
    const demoLyrics = generateDemoLyrics(store.currentTrack?.name || 'Canción');
    lyrics.value = demoLyrics;
    
  } catch (error) {
    console.error('Error buscando letras:', error);
  } finally {
    isLoading.value = false;
  }
}

// Activar modo de edición
function startEdit() {
  editLyrics.value = lyrics.value || '';
  editMode.value = true;
}

// Cancelar edición
function cancelEdit() {
  editMode.value = false;
}

// Guardar edición
function saveLyricsEdit() {
  lyrics.value = editLyrics.value;
  editMode.value = false;
  
  // Si hay una canción actual, guarda las letras
  if (store.currentTrack?.id) {
    saveLyrics();
  }
}

// Guardar letras en localStorage
function saveLyrics() {
  if (!store.currentTrack?.id || !lyrics.value) return;
  
  try {
    lyricsDB.value[store.currentTrack.id] = lyrics.value;
    localStorage.setItem('vaporwave_player_lyrics', JSON.stringify(lyricsDB.value));
  } catch (error) {
    console.error('Error guardando letras:', error);
  }
}

// Formatear letras para mostrar
const formattedLyrics = computed(() => {
  if (!lyrics.value) return '';
  
  // Reemplazar saltos de línea por etiquetas <br>
  let formatted = lyrics.value
    .replace(/\n/g, '<br>')
    .replace(/\[([^\]]+)\]/g, '<span class="text-vaporwave5 font-medium">[$1]</span>');
  
  return formatted;
});

// Función para generar letras de ejemplo
function generateDemoLyrics(songName) {
  return `[Verso 1]
En la noche digital, entre luces de neón
Los recuerdos se desvanecen, como ondas de vapor
${songName} suena en la distancia
Mientras el tiempo se detiene en esta danza

[Coro]
Atrapados en el loop de melodías
Pixeles y sintetizadores, creando armonías
En este mundo retrowave, de sueños y fantasías
Donde el futuro y el pasado se unen cada día

[Verso 2]
Conduciendo por la autopista del ciberespacio
Las estrellas digitales brillan en el palacio
De este universo vaporwave que hemos creado
Donde los sentimientos nunca son olvidados`;
}
</script>

<style scoped>
.loading-bar {
  animation: loading 1.5s infinite;
  width: 30%;
}

@keyframes loading {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(300%);
  }
}

.custom-scrollbar-vaporwave::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar-vaporwave::-webkit-scrollbar-track {
  background: var(--color-vaporwave3);
}

.custom-scrollbar-vaporwave::-webkit-scrollbar-thumb {
  background-color: var(--color-vaporwave4);
  border-radius: 0;
}

.lyrics-content {
  line-height: 1.6;
}
</style>
