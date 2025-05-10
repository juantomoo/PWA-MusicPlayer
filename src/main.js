import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'

// Importar vistas para el router
import NowPlayingView from './views/NowPlayingView.vue'
import EqualizerView from './views/EqualizerView.vue'
import PlaylistsView from './views/PlaylistsView.vue'
import LyricsView from './views/LyricsView.vue'

// Configuración de rutas
const routes = [
  { path: '/', component: NowPlayingView },
  { path: '/equalizer', component: EqualizerView },
  { path: '/playlists', component: PlaylistsView },
  { path: '/lyrics', component: LyricsView }
]

// Crear instancia de router
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Crear y montar la aplicación
const app = createApp(App)

// Crear instancia de Pinia
const pinia = createPinia();
app.use(pinia);

app.use(router)
app.mount('#app')

// Registro del Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/registerSW.js')
      .then(registration => {
        console.log('Service worker registrado correctamente:', registration)
      })
      .catch(error => {
        console.error('Error al registrar el service worker:', error)
      })
  })
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Mostrar un banner/botón personalizado
  window.dispatchEvent(new CustomEvent('show-install-banner'));
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  // Ocultar el banner/botón
  window.dispatchEvent(new CustomEvent('hide-install-banner'));
});
