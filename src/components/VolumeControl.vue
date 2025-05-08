<template>
  <div class="flex items-center gap-2">
    <span class="text-xs text-vaporwave4">🔊</span>
    <input type="range" min="0" max="1" step="0.01" :value="modelValue" @input="$emit('update:modelValue', $event.target.valueAsNumber)" class="accent-vaporwave2 w-24" />
  </div>
</template>
<script setup>
defineProps({ modelValue: Number });
</script>