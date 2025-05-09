<template>
  <div v-if="loading" class="loading-progress-panel">
    <div class="loading-progress-container">
      <div class="loading-progress-info">
        <span class="loading-text">Cargando archivos</span>
        <span class="loading-percentage">{{ percentage }}%</span>
      </div>
      <div class="loading-count">{{ processed }} / {{ total }}</div>
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: `${percentage}%` }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  processed: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  }
});

// Calcular el porcentaje de progreso
const percentage = computed(() => {
  if (props.total <= 0) return 0;
  return Math.round((props.processed / props.total) * 100);
});
</script>

<style scoped>
.loading-progress-panel {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background-color: var(--color-vaporwave3, #552A93);
  border: 3px solid var(--color-vaporwave2, #E5156D);
  border-radius: 8px;
  z-index: 999;
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  pointer-events: none; /* Permite interactuar con elementos debajo del panel */
}

.loading-progress-container {
  padding: 15px;
  text-align: center;
}

.loading-progress-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
}

.loading-text {
  color: white;
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 8px;
}

.loading-percentage {
  color: var(--color-vaporwave4, #FDC47F);
  font-weight: 700;
  font-size: 40px;
  line-height: 1;
  margin-bottom: 8px;
}

.loading-count {
  color: white;
  font-size: 14px;
  margin-bottom: 15px;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: var(--color-vaporwave4, #FDC47F);
  transition: width 0.3s ease;
}

@keyframes pulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

.progress-bar {
  animation: pulse 1.5s infinite;
}
</style>