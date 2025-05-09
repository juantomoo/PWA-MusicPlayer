<template>
  <nav class="tabs-nav">
    <div class="tabs-flex">
      <router-link to="/" class="tab-link" active-class="active-tab">
        <div>🎵</div>
        <div>Reproductor</div>
      </router-link>
      <router-link to="/equalizer" class="tab-link" active-class="active-tab">
        <div>🎚️</div>
        <div>Ecualizador</div>
      </router-link>
      <router-link to="/playlists" class="tab-link" active-class="active-tab">
        <div>📋</div>
        <div>Playlists</div>
      </router-link>
      <router-link to="/lyrics" class="tab-link" active-class="active-tab">
        <div>📝</div>
        <div>Letras</div>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
// No se requiere lógica adicional para este componente
</script>