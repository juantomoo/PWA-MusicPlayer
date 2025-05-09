<template>
  <div class="loading-progress-panel">
    <div class="loading-progress-container">
      <div class="loading-progress-info">
        <span class="loading-text">{{ message || 'Cargando' }}</span>
        <span class="loading-percentage">{{ displayPercentage }}%</span>
      </div>
      <div v-if="showCounts" class="loading-count">{{ processed }} / {{ total }}</div>
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: `${displayPercentage}%` }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // Se puede usar "processed" y "total" para calcular el porcentaje
  processed: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  // O se puede pasar directamente un valor de progreso (0-100)
  progress: {
    type: Number,
    default: null
  },
  message: {
    type: String,
    default: ''
  },
  showCounts: {
    type: Boolean,
    default: false
  }
});

// Calcular el porcentaje de progreso
const displayPercentage = computed(() => {
  // Si se proporciona un progreso directo, usarlo
  if (props.progress !== null) {
    return Math.max(0, Math.min(100, Math.round(props.progress)));
  }
  
  // Si no, calcularlo a partir de processed y total
  if (props.total <= 0) return 0;
  return Math.round((props.processed / props.total) * 100);
});
</script>

<style scoped>
.loading-progress-panel {
  width: 100%;
  max-width: 400px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: var(--space-md);
  box-shadow: var(--shadow-md);
}

.loading-progress-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.loading-progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.loading-text {
  font-size: 1rem;
  color: var(--color-vaporwave1);
}

.loading-percentage {
  font-weight: bold;
  color: var(--color-vaporwave4);
}

.loading-count {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  text-align: right;
  margin-bottom: var(--space-xs);
}

.progress-bar-container {
  height: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: var(--color-vaporwave1);
  background-image: linear-gradient(90deg, var(--color-vaporwave1), var(--color-vaporwave4));
  width: 0%;
  transition: width 0.3s ease;
}
</style>