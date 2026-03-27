<template>
  <nav class="navbar" :class="{ scrolled: isScrolled }">
    <div class="nav-container container">
      <router-link to="/pokedex" class="nav-brand">
        <span class="brand-icon">◓</span>
        <span class="brand-text">Pokédex</span>
      </router-link>

      <button class="nav-toggle" @click="menuOpen = !menuOpen" :class="{ active: menuOpen }">
        <span></span><span></span><span></span>
      </button>

      <div class="nav-links" :class="{ open: menuOpen }">
        <router-link to="/pokedex" class="nav-link" @click="menuOpen = false">
          <span class="nav-icon">📋</span> Pokédex
        </router-link>
        <router-link to="/favorites" class="nav-link" @click="menuOpen = false">
          <span class="nav-icon">❤️</span> Favoritos
        </router-link>
        <router-link to="/teams" class="nav-link" @click="menuOpen = false">
          <span class="nav-icon">⚔️</span> Equipos
        </router-link>
        <router-link to="/social" class="nav-link" @click="menuOpen = false">
          <span class="nav-icon">👥</span> Social
        </router-link>
        <router-link to="/battles" class="nav-link" @click="menuOpen = false">
          <span class="nav-icon">🏟️</span> Combates
        </router-link>

        <div class="nav-user">
          <span class="user-name">{{ user?.username }}</span>
          <button class="btn btn-sm btn-secondary" @click="logout">Cerrar Sesión</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const menuOpen = ref(false);
const isScrolled = ref(false);
const user = computed(() => authStore.user);

function logout() {
  authStore.logout();
  router.push('/');
}

function onScroll() {
  isScrolled.value = window.scrollY > 20;
}

onMounted(() => {
  window.addEventListener('scroll', onScroll);
});

onUnmounted(() => window.removeEventListener('scroll', onScroll));
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(12, 14, 24, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  transition: all 0.3s;
}

.navbar.scrolled {
  box-shadow: var(--shadow-md);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary) !important;
}

.brand-icon {
  font-size: 1.6rem;
  animation: spin 8s linear infinite;
}

.brand-text {
  background: linear-gradient(135deg, #fff, var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary) !important;
  transition: all 0.2s;
}

.nav-link:hover, .nav-link.router-link-active {
  background: var(--bg-card-hover);
  color: var(--text-primary) !important;
}

.nav-link.router-link-active {
  color: var(--accent) !important;
}

.nav-icon {
  font-size: 1rem;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 1px solid var(--border);
}

.user-name {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.notify-btn {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--text-muted);
}

.notify-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.notify-btn.active {
  color: var(--accent);
}

.spinner-tiny {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.1);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.nav-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
}

.nav-toggle span {
  width: 22px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: all 0.3s;
}

.nav-toggle.active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.nav-toggle.active span:nth-child(2) { opacity: 0; }
.nav-toggle.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

@media (max-width: 900px) {
  .nav-toggle { display: flex; }

  .nav-links {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    padding: 1rem;
    gap: 0.5rem;
  }

  .nav-links.open { display: flex; }

  .nav-user {
    margin: 0;
    padding: 0.75rem 0 0;
    border-left: none;
    border-top: 1px solid var(--border);
    justify-content: space-between;
  }
}
</style>
