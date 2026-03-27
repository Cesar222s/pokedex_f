<template>
  <div class="auth-page">
    <!-- Animated background -->
    <div class="bg-balls">
      <div class="bg-ball" v-for="i in 8" :key="i"></div>
    </div>

    <div class="auth-container animate-fade-in-up">
      <div class="auth-logo">
        <span class="logo-icon">◓</span>
        <h1>PokéDex</h1>
        <p>Tu compañero Pokémon definitivo</p>
      </div>

      <form class="auth-form glass" @submit.prevent="handleLogin">
        <h2>Iniciar Sesión</h2>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <div class="input-group">
          <label for="login-email">Correo Electrónico</label>
          <input id="login-email" type="email" class="input" placeholder="entrenador@pokedex.com"
            v-model="email" required autocomplete="email" />
        </div>

        <div class="input-group">
          <label for="login-password">Contraseña</label>
          <input id="login-password" type="password" class="input" placeholder="••••••••"
            v-model="password" required autocomplete="current-password" />
        </div>

        <button type="submit" class="btn btn-primary btn-lg" style="width:100%"
          :disabled="authStore.loading">
          {{ authStore.loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>

        <p class="auth-switch">
          ¿Nuevo entrenador? <router-link to="/register">Crear cuenta</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';

const router = useRouter();
const authStore = useAuthStore();
const notificationsStore = useNotificationStore();

const email = ref('');
const password = ref('');
const error = computed(() => authStore.error);

async function handleLogin() {
  try {
    await authStore.login(email.value, password.value);
    
    // Trigger notification prompt immediately (Login click is a User Gesture)
    notificationsStore.subscribe().catch(err => {
      console.log('Login: Notification prompt declined or failed.', err);
    });

    router.push('/pokedex');
  } catch {
    // error is shown via computed
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 2rem;
}

.bg-balls {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-ball {
  position: absolute;
  border-radius: 50%;
  opacity: 0.04;
  animation: float var(--dur) ease-in-out infinite;
}

.bg-ball:nth-child(1) { width: 300px; height: 300px; top: -10%; left: -5%; background: var(--accent); --dur: 6s; }
.bg-ball:nth-child(2) { width: 200px; height: 200px; top: 60%; right: -5%; background: var(--accent-dark); --dur: 8s; }
.bg-ball:nth-child(3) { width: 150px; height: 150px; top: 20%; right: 15%; background: #ffffff; --dur: 7s; }
.bg-ball:nth-child(4) { width: 250px; height: 250px; bottom: -5%; left: 10%; background: var(--accent); --dur: 5s; }
.bg-ball:nth-child(5) { width: 100px; height: 100px; top: 40%; left: 30%; background: #ffffff; --dur: 9s; }
.bg-ball:nth-child(6) { width: 180px; height: 180px; bottom: 20%; right: 25%; background: var(--accent-dark); --dur: 7.5s; }
.bg-ball:nth-child(7) { width: 120px; height: 120px; top: 70%; left: 60%; background: var(--accent); --dur: 6.5s; }
.bg-ball:nth-child(8) { width: 350px; height: 350px; top: 30%; right: -10%; background: #ffffff; --dur: 10s; }

.auth-container {
  width: 100%;
  max-width: 420px;
  z-index: 1;
}

.auth-logo {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-icon {
  font-size: 4rem;
  display: block;
  animation: spin 6s linear infinite;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 0 20px var(--accent));
}

.auth-logo h1 {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  background: linear-gradient(135deg, #fff, var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.auth-logo p {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.auth-form {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.auth-form h2 {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.auth-switch {
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
}
</style>
