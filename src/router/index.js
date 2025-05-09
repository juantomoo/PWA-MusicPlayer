import { createRouter, createWebHistory } from 'vue-router';
import NowPlayingView from '../views/NowPlayingView.vue';
import EqualizerView from '../views/EqualizerView.vue';
import PlaylistsView from '../views/PlaylistsView.vue';
import LetrasView from '../views/LetrasView.vue';

const routes = [
  {
    path: '/',
    name: 'NowPlaying',
    component: NowPlayingView,
  },
  {
    path: '/equalizer',
    name: 'Equalizer',
    component: EqualizerView,
  },
  {
    path: '/playlists',
    name: 'Playlists',
    component: PlaylistsView,
  },
  {
    path: '/lyrics',
    name: 'Letras',
    component: LetrasView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
