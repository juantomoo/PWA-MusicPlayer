<template>
  <div class="bg-vaporwave3 border border-vaporwave5 p-2 rounded-none">
    <div class="flex items-center gap-1">
      <!-- Ícono de volumen -->
      <button @click="toggleMute" class="text-vaporwave4 hover:text-vaporwave1">
        <span v-if="isMuted || volume === 0">🔇</span>
        <span v-else-if="volume < 0.5">🔉</span>
        <span v-else>🔊</span>
      </button>
      
      <!-- Slider de volumen (versión compacta para el footer) -->
      <input 
        type="range" 
        min="0" 
        max="1"
        step="0.01" 
        :value="isMuted ? 0 : volume" 
        @input="handleVolumeChange" 
        class="flex-grow h-2 volume-slider"
        :style="`background: linear-gradient(to right, var(--color-vaporwave4) 0%, var(--color-vaporwave4) ${volumePercentage}%, var(--color-vaporwave5) ${volumePercentage}%, var(--color-vaporwave5) 100%);`"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0.7
  }
});

const emit = defineEmits(['update:modelValue']);

// Estado
const volume = computed(() => props.modelValue);
const isMuted = ref(false);
const previousVolume = ref(0.7);

// Calcular porcentaje para la visualización
const volumePercentage = computed(() => {
  if (isMuted.value) return 0;
  return volume.value * 100;
});

// Manejar cambio desde el slider
function handleVolumeChange(event) {
  const newVolume = parseFloat(event.target.value);
  
  // Si estaba silenciado y ahora se mueve el slider, quitar silencio
  if (isMuted.value && newVolume > 0) {
    isMuted.value = false;
  }
  
  // Si el volumen llega a cero, silenciar
  if (newVolume === 0) {
    isMuted.value = true;
  } else {
    previousVolume.value = newVolume;
  }
  
  // Emitir cambio
  emit('update:modelValue', newVolume);
}

// Alternar silencio
function toggleMute() {
  if (isMuted.value) {
    // Restaurar volumen
    isMuted.value = false;
    emit('update:modelValue', previousVolume.value);
  } else {
    // Silenciar
    previousVolume.value = volume.value || 0.5;
    isMuted.value = true;
    emit('update:modelValue', 0);
  }
}
</script>

<style scoped>
.volume-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: var(--color-vaporwave5);
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: var(--color-vaporwave4);
  cursor: pointer;
  border-radius: 0;
  border: none;
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: var(--color-vaporwave4);
  cursor: pointer;
  border-radius: 0;
  border: none;
}
</style>