import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/',
    name: 'Login',
    alias: '/login',
    component: () => import('@/views/LoginView.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue')
  },
  {
    path: '/pokedex',
    name: 'Pokedex',
    component: () => import('@/views/PokedexView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pokemon/:id',
    name: 'PokemonDetail',
    component: () => import('@/views/PokemonDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/views/FavoritesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/teams',
    name: 'Teams',
    component: () => import('@/views/TeamsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/social',
    name: 'Social',
    component: () => import('@/views/SocialView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/battles',
    name: 'Battles',
    component: () => import('@/views/BattlesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/battles/:id',
    name: 'BattleArena',
    component: () => import('@/views/BattleArenaView.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'Login' };
  }
  if ((to.name === 'Login' || to.name === 'Register') && authStore.isAuthenticated) {
    return { name: 'Pokedex' };
  }
});

export default router;
