<template>
  <div id="app">
    <header>
      <div class="header-content">
        <img src="/icons/icon-192x192.png" alt="Logo" class="logo" />
        <h1>PWA Music Player</h1>
      </div>
    </header>

    <nav>
      <router-link to="/">Reproduciendo</router-link>
      <router-link to="/equalizer">Ecualizador</router-link>
      <router-link to="/playlists">Playlists</router-link>
      <router-link to="/lyrics">Letras</router-link>
    </nav>

    <main>
      <router-view></router-view>
    </main>

    <footer>
      <PlayerControls />
      <audio id="audio-player" style="display:none"></audio>
    </footer>
  </div>
</template>

<script>
import PlayerControls from './components/PlayerControls.vue';

export default {
  name: 'App',
  components: { PlayerControls },
  data() {
    return {
      // Estado básico inicial
    }
  },
  mounted() {
    // Inicialización básica
  },
  methods: {
    // Métodos básicos
  }
}
</script>

<style>
/* Estilos básicos - Los detalles estarán en style.css */
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background-color: var(--color-vaporwave5);
  padding: 0.5rem 1rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  height: 40px;
  width: auto;
}

nav {
  background-color: var(--color-vaporwave3);
  display: flex;
  justify-content: space-around;
  padding: 0.5rem;
}

nav a {
  color: var(--color-vaporwave4);
  text-decoration: none;
  padding: 0.5rem 1rem;
}

nav a.router-link-active {
  border-bottom: 2px solid var(--color-vaporwave2);
  font-weight: bold;
}

main {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background-color: var(--color-vaporwave3);
}

footer {
  background-color: var(--color-vaporwave5);
  padding: 1rem;
}
</style>
