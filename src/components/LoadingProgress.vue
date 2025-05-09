<template>
  <div class="loading-progress-panel">
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

</style>