<template>
  <div class="devtools">
    <div class="devtools-header">
      <h2 class="devtools-title">DevTools</h2>
      <div class="devtools-buttons">
        <button @click="showPwaStatus = !showPwaStatus">
          PWA: {{ pwaStatus }}
        </button>
        <button @click="showInfo = !showInfo">
          {{ showInfo ? 'Ocultar' : 'Mostrar' }} Info
        </button>
        <button @click="showPlayer = !showPlayer">
          {{ showPlayer ? 'Ocultar' : 'Mostrar' }} Player
        </button>
      </div>
    </div>
    
    <div v-if="showPwaStatus" class="devtools-section">
      <h3 class="devtools-section-title">Estado PWA</h3>
      <div class="devtools-grid">
        <div>Instalada: {{ pwaInstalled ? 'Sí' : 'No' }}</div>
        <div>SW Activo: {{ swActive ? 'Sí' : 'No' }}</div>
        <div>Online: {{ online ? 'Sí' : 'No' }}</div>
        <div>Modo: {{ mode }}</div>
      </div>
    </div>
    
    <div v-if="showInfo" class="devtools-section">
      <h3 class="devtools-section-title">Información</h3>
      <div class="devtools-table-wrapper">
        <table class="devtools-table">
          <thead>
            <tr>
              <th>Variable</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(value, key) in envVars" :key="key">
              <td>{{ key }}</td>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div v-if="showPlayer" class="devtools-section">
      <h3 class="devtools-section-title">Reproductor</h3>
      <div v-if="playerStore.state.currentTrack">
        <div class="devtools-grid">
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
  background: #222;
  color: #fff;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 240px;
  overflow-y: auto;
  z-index: 50;
  font-family: monospace;
}
.devtools-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.devtools-title {
  color: var(--color-vaporwave4);
  font-weight: bold;
}
.devtools-buttons {
  display: flex;
  gap: 8px;
}
.devtools-section {
  margin-bottom: 8px;
  background: #333;
  padding: 8px;
  border-radius: 4px;
}
.devtools-section-title {
  color: var(--color-vaporwave1);
  font-weight: bold;
  margin-bottom: 4px;
}
.devtools-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 8px;
}
.devtools-table-wrapper {
  overflow-x: auto;
}
.devtools-table {
  width: 100%;
  border-collapse: collapse;
}
.devtools-table th, .devtools-table td {
  padding: 2px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  text-align: left;
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
