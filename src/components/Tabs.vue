<template>
  <div class="flex w-full justify-around border-b border-vaporwave2 mb-2 sticky top-0 bg-vaporwave5 z-10">
    <button v-for="tab in tabs" :key="tab.name" @click="$emit('change', tab.name)" :class="['flex-1 py-2', tab.name === modelValue ? 'font-bold text-vaporwave2 border-b-2 border-vaporwave2' : 'text-vaporwave4']">
      {{ tab.label }}
    </button>
  </div>
</template>
<script setup>
defineProps({ tabs: Array, modelValue: String });
</script>