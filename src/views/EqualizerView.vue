<template>
  <div class="flex flex-col gap-4 p-2">
    <h1 class="text-2xl font-bold text-vaporwave4">Ecualizador</h1>
    
    <div class="bg-vaporwave5 border-2 border-vaporwave2 rounded-none shadow-lg p-4 text-center relative">
      <!-- Visualización -->
      <div class="h-32 mb-6 border border-vaporwave4 flex items-end justify-around px-2 py-4">
        <div v-for="(val, index) in visualizerData" :key="index" 
             class="w-2 bg-gradient-to-t from-vaporwave2 to-vaporwave1"
             :style="{ height: `${val}%` }"></div>
      </div>
      
      <!-- Controles de ecualizador -->
      <div class="flex gap-3 sm:gap-1 mb-4">
        <div v-for="(band, index) in eqBands" :key="index" class="flex flex-col items-center">
          <input 
            type="range" 
            min="-12" 
            max="12" 
            step="0.5"
            v-model.number="band.gain"
            @input="updateEqualizerBands"
            class="h-32 accent-vaporwave4 cursor-pointer vertical-slider"
          />
          <span class="text-xs text-vaporwave1 mt-1">{{ band.label }}</span>
          <span class="text-2xs text-vaporwave4 mt-0.5">{{ band.gain >= 0 ? '+' : '' }}{{ band.gain }}dB</span>
        </div>
      </div>
      
      <!-- Presets de ecualización -->
      <div class="flex gap-1 mt-4">
        <button 
          v-for="preset in presets" 
          :key="preset.name"
          @click="applyPreset(preset)"
          class="px-2 py-1 bg-vaporwave3 hover:bg-vaporwave2 text-white text-xs sm:text-sm rounded-none border border-vaporwave4"
        >
          {{ preset.name }}
        </button>
      </div>
      
      <!-- Potenciador de sonido -->
      <div class="mt-6 border-t border-vaporwave3 pt-4">
        <h3 class="text-vaporwave4 font-bold mb-2">Potenciador de sonido</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-vaporwave1 block mb-1">Graves</label>
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="0.1"
              v-model.number="bassBoost"
              @input="updateAudioEnhancers"
              class="w-full accent-vaporwave4 cursor-pointer"
            />
            <div class="text-2xs text-right text-vaporwave4">{{ Math.round(bassBoost * 100) }}%</div>
          </div>
          <div>
            <label class="text-xs text-vaporwave1 block mb-1">Claridad</label>
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="0.1"
              v-model.number="trebleBoost"
              @input="updateAudioEnhancers"
              class="w-full accent-vaporwave4 cursor-pointer"
            />
            <div class="text-2xs text-right text-vaporwave4">{{ Math.round(trebleBoost * 100) }}%</div>
          </div>
        </div>
      </div>
      
      <!-- Efectos adicionales -->
      <div class="mt-6 flex justify-between">
        <label class="inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="spatialAudio" @change="updateAudioEffects" class="sr-only" />
          <span class="relative">
            <span class="block w-10 h-5 bg-vaporwave5 rounded-full shadow-inner"></span>
            <span class="absolute block w-4 h-4 mt-0.5 ml-0.5 rounded-full bg-vaporwave4 shadow transform transition-transform duration-200 ease-in-out"
                  :class="{ 'translate-x-5': spatialAudio }"></span>
          </span>
          <span class="ml-2 text-vaporwave1 text-xs">Sonido 3D</span>
        </label>
        
        <label class="inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="normalizeVolume" @change="updateAudioEffects" class="sr-only" />
          <span class="relative">
            <span class="block w-10 h-5 bg-vaporwave5 rounded-full shadow-inner"></span>
            <span class="absolute block w-4 h-4 mt-0.5 ml-0.5 rounded-full bg-vaporwave4 shadow transform transition-transform duration-200 ease-in-out"
                  :class="{ 'translate-x-5': normalizeVolume }"></span>
          </span>
          <span class="ml-2 text-vaporwave1 text-xs">Normalizar volumen</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import audioManager from '../utils/audioManager';

// Estado del ecualizador
const eqBands = reactive([
  { freq: 60, gain: 0, label: '60Hz' },
  { freq: 170, gain: 0, label: '170Hz' },
  { freq: 310, gain: 0, label: '310Hz' },
  { freq: 600, gain: 0, label: '600Hz' },
  { freq: 1000, gain: 0, label: '1kHz' },
  { freq: 3000, gain: 0, label: '3kHz' },
  { freq: 6000, gain: 0, label: '6kHz' },
  { freq: 12000, gain: 0, label: '12kHz' },
]);

// Presets de ecualizador
const presets = [
  { name: 'Plano', values: [0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'Rock', values: [3, 2, -0.5, -1, -1, 1, 2.5, 3] },
  { name: 'Pop', values: [-1, -1, 0, 2, 3, 2, 0, -1.5] },
  { name: 'Jazz', values: [2, 1, 1, -0.5, -0.5, 1, 2, 3] },
  { name: 'Clásica', values: [2, 1.5, 0, 0, 0, 0.5, 2, 3.5] },
  { name: 'Electrónica', values: [4, 3, 0, -2, -1, 1, 3, 4] },
  { name: 'Vaporwave', values: [2, -1, -2, -2, 2, 4, 3, 0.5] },
  { name: 'Cine', values: [2.5, 2, 1, 0, -1, 0, 1.5, 3] },
];

// Potenciadores y efectos
const bassBoost = ref(0.5); // 0-2
const trebleBoost = ref(0.5); // 0-2
const spatialAudio = ref(false);
const normalizeVolume = ref(true);

// Datos para visualizador (placeholder)
const visualizerData = ref(Array(40).fill(0));
let visualizerInterval = null;

// Aplicar preset de ecualización
function applyPreset(preset) {
  preset.values.forEach((gain, index) => {
    if (eqBands[index]) {
      eqBands[index].gain = gain;
    }
  });
  updateEqualizerBands();
}

// Actualizar bandas del ecualizador
function updateEqualizerBands() {
  audioManager.setEqualizerBands(eqBands);
}

// Actualizar potenciadores de audio
function updateAudioEnhancers() {
  // Esta función se implementará en la versión completa
  console.log('Actualizando potenciadores:', { bassBoost: bassBoost.value, trebleBoost: trebleBoost.value });
}

// Actualizar efectos de audio
function updateAudioEffects() {
  // Esta función se implementará en la versión completa
  console.log('Actualizando efectos:', { spatialAudio: spatialAudio.value, normalizeVolume: normalizeVolume.value });
}

// Actualizar visualizador
function updateVisualizer() {
  // Simulación básica para visualización
  const data = audioManager.getAnalyserData();
  
  if (data) {
    // Utilizar datos reales del analizador
    visualizerData.value = Array.from({ length: 40 }, (_, i) => {
      const index = Math.floor(i * (data.length / 40));
      return (data[index] / 255) * 100; // Normalizado a porcentaje
    });
  } else {
    // Simulación si no hay datos disponibles
    visualizerData.value = Array.from({ length: 40 }, () => {
      return Math.random() * 80 + (spatialAudio.value ? 15 : 5);
    });
  }
}

// Configuración inicial
onMounted(() => {
  // Iniciar visualizador
  visualizerInterval = setInterval(updateVisualizer, 100);
  
  // Aplicar configuración inicial
  updateEqualizerBands();
});

// Limpieza
onBeforeUnmount(() => {
  if (visualizerInterval) {
    clearInterval(visualizerInterval);
  }
});
</script>

<style scoped>
/* Estilos para sliders verticales con solución moderna */
.vertical-slider {
  writing-mode: vertical-lr; 
  direction: rtl;
  width: 32px;
  margin: 0 auto;
}

/* Tamaño de letra muy pequeño para valores */
.text-2xs {
  font-size: 0.65rem;
}
</style>
