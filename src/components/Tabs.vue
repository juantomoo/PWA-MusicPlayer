<template>
  <nav class="w-full">
    <div class="flex text-center">
      <router-link to="/" class="tab-link" active-class="active-tab">
        <div class="text-lg">🎵</div>
        <div class="text-xs">Reproductor</div>
      </router-link>
      
      <router-link to="/equalizer" class="tab-link" active-class="active-tab">
        <div class="text-lg">🎚️</div>
        <div class="text-xs">Ecualizador</div>
      </router-link>
      
      <router-link to="/playlists" class="tab-link" active-class="active-tab">
        <div class="text-lg">📋</div>
        <div class="text-xs">Playlists</div>
      </router-link>
      
      <router-link to="/lyrics" class="tab-link" active-class="active-tab">
        <div class="text-lg">📝</div>
        <div class="text-xs">Letras</div>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
// No se requiere lógica adicional para este componente
</script>

<style scoped>
.tab-link {
  display: block;
  padding: 0.5rem 0.25rem;
  color: var(--color-vaporwave4);
  text-decoration: none;
  transition: background-color 0.2s, color 0.2s;
  user-select: none;
}

.tab-link:hover {
  background-color: var(--color-vaporwave5);
}

.active-tab {
  background-color: var(--color-vaporwave5);
  color: white;
  position: relative;
}

.active-tab::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 25%;
  width: 50%;
  height: 3px;
  background-color: var(--color-vaporwave2);
}
</style>