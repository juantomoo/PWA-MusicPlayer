<template>
  <div class="bg-vaporwave3 border border-vaporwave5 p-2 rounded-none">
    <div class="flex items-center gap-1">
      <!-- Ícono de volumen -->
      <button @click="toggleMute" class="text-vaporwave4 hover:text-vaporwave1 volume-btn">
        <img v-if="isMuted || volume === 0" src="/src/assets/volume_off.svg" alt="Silenciado" class="icon-svg" />
        <img v-else src="/src/assets/volume_up.svg" alt="Volumen" class="icon-svg" />
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
        :style="`background: linear-gradient(to right, #FDC47F 0%, #FDC47F ${volumePercentage}%, #1A1225 ${volumePercentage}%, #1A1225 100%);`"
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
.icon-svg {
  width: 22px;
  height: 22px;
  vertical-align: middle;
  filter: drop-shadow(0 0 1px #552A93);
}
.volume-btn {
  background: none;
  border: none;
  padding: 0;
  margin-right: 0.2em;
  cursor: pointer;
  display: flex;
  align-items: center;
}
</style>