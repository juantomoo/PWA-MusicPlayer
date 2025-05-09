<template>
  <div class="devtools p-4 bg-gray-800 text-white font-mono text-xs fixed bottom-0 left-0 right-0 max-h-60 overflow-y-auto z-50 shadow-lg">
    <div class="flex justify-between items-center mb-2">
      <h2 class="text-vaporwave4 font-bold">DevTools</h2>
      <div class="flex gap-2">
        <button @click="showPwaStatus = !showPwaStatus" class="px-2 py-0.5 bg-vaporwave3 text-white rounded hover:bg-vaporwave2">
          PWA: {{ pwaStatus }}
        </button>
        <button @click="showInfo = !showInfo" class="px-2 py-0.5 bg-vaporwave5 text-white rounded hover:bg-vaporwave1">
          {{ showInfo ? 'Ocultar' : 'Mostrar' }} Info
        </button>
        <button @click="showPlayer = !showPlayer" class="px-2 py-0.5 bg-vaporwave2 text-white rounded hover:bg-vaporwave4">
          {{ showPlayer ? 'Ocultar' : 'Mostrar' }} Player
        </button>
      </div>
    </div>
    
    <div v-if="showPwaStatus" class="mb-2 p-2 bg-gray-700 rounded">
      <h3 class="font-bold text-vaporwave1">Estado PWA</h3>
      <div class="grid grid-cols-2 gap-2">
        <div>Instalada: {{ pwaInstalled ? 'Sí' : 'No' }}</div>
        <div>SW Activo: {{ swActive ? 'Sí' : 'No' }}</div>
        <div>Online: {{ online ? 'Sí' : 'No' }}</div>
        <div>Modo: {{ mode }}</div>
      </div>
    </div>
    
    <div v-if="showInfo" class="mb-2 p-2 bg-gray-700 rounded">
      <h3 class="font-bold text-vaporwave4">Información</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr>
              <th>Variable</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(value, key) in envVars" :key="key">
              <td class="pr-2">{{ key }}</td>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div v-if="showPlayer" class="mb-2 p-2 bg-gray-700 rounded">
      <h3 class="font-bold text-vaporwave2">Reproductor</h3>
      <div v-if="playerStore.state.currentTrack">
        <div class="grid grid-cols-2 gap-2">
          <div>Pista: {{ playerStore.state.currentTrack.title || playerStore.state.currentTrack.name }}</div>
          <div>Artista: {{ playerStore.state.currentTrack.artist || 'N/A' }}</div>
          <div>Álbum: {{ playerStore.state.currentTrack.album || 'N/A' }}</div>
          <div>Duración: {{ formatTime(playerStore.state.duration) }}</div>
          <div>Estado: {{ playerStore.state.isPlaying ? 'Reproduciendo' : 'Pausado' }}</div>
          <div>Volumen: {{ Math.round(playerStore.state.volume * 100) }}%</div>
        </div>
      </div>
      <div v-else>No hay pista activa</div>
    </div>
  </div>

  <div class="dev-tools">
    <div class="dev-panel">
      <h3>Dev Tools</h3>
      <button @click="handleForceReset">Reset State</button>
      <button @click="handleForceBanner">Mostrar Banner</button>
      <pre>{{ JSON.stringify(store.state, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { usePlayerStore } from '../utils/playerStore';

// Acceder a las variables de entorno en el script
const mode = import.meta.env.MODE;
const baseUrl = import.meta.env.BASE_URL;
const isProd = import.meta.env.PROD;
const isDev = import.meta.env.DEV;

const playerStore = usePlayerStore();

// Estado de visibilidad
const showPwaStatus = ref(true);
const showInfo = ref(false);
const showPlayer = ref(true);

// Estado de PWA
const pwaStatus = ref('Cargando...');
const pwaInstalled = ref(false);
const swActive = ref(false);
const online = ref(navigator.onLine);

// Variables de entorno
const envVars = computed(() => ({
  'NODE_ENV': mode,
  'BASE_URL': baseUrl,
  'PROD': isProd,
  'DEV': isDev,
  'Navegador': navigator.userAgent,
  'Plataforma': navigator.platform
}));

// Formatear tiempo en formato mm:ss
function formatTime(seconds) {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Monitorear cambios en la conexión
window.addEventListener('online', () => online.value = true);
window.addEventListener('offline', () => online.value = false);

onMounted(() => {
  // Comprobar estado del Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        swActive.value = true;
        pwaStatus.value = 'Registrado';
      } else {
        pwaStatus.value = 'No registrado';
      }
    });
  } else {
    pwaStatus.value = 'No soportado';
  }
  
  // Comprobar si la PWA está instalada
  if (window.matchMedia('(display-mode: standalone)').matches) {
    pwaInstalled.value = true;
  }
  
  // Escuchar evento de instalación de PWA
  window.addEventListener('appinstalled', () => {
    pwaInstalled.value = true;
    console.log('PWA instalada correctamente');
  });
});

const store = usePlayerStore();

// Para probar el banner de progreso
const isLoadingFiles = ref(false);
const totalFiles = ref(10);
const processedFiles = ref(0);

function handleForceReset() {
  store.reset();
}

function handleForceBanner() {
  // Mostrar el banner de carga para pruebas
  window.isLoadingFiles = true;
  window.totalFiles = 10;
  window.processedFiles = 0;
  
  // Simular progreso
  let count = 0;
  const interval = setInterval(() => {
    count++;
    window.processedFiles = count;
    console.log(`Progreso simulado: ${count}/10`);
    if (count >= 10) {
      clearInterval(interval);
      setTimeout(() => {
        window.isLoadingFiles = false;
        console.log('Banner de carga ocultado');
      }, 1000);
    }
  }, 500);
}
</script>

<style scoped>
.devtools {
  border-top: 2px solid var(--color-vaporwave-list-fav, #FDC47F);
  font-size: 0.75rem;
  line-height: 1.2;
}

table {
  border-collapse: collapse;
}

table td, table th {
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dev-tools {
  position: fixed;
  right: 0;
  bottom: 150px;
  width: 320px;
  max-height: 300px;
  background: rgba(0,0,0,0.8);
  color: lime;
  font-family: monospace;
  font-size: 10px;
  z-index: 9999;
  overflow: auto;
}

.dev-panel {
  padding: 10px;
}

.dev-panel pre {
  white-space: pre-wrap;
}

.dev-panel button {
  background: #333;
  color: lime;
  border: 1px solid lime;
  margin: 5px;
  padding: 2px 5px;
  font-family: monospace;
  cursor: pointer;
}

.dev-panel button:active {
  background: lime;
  color: black;
}

h3 {
  margin-top: 0;
  border-bottom: 1px solid lime;
  padding-bottom: 5px;
}
</style>
