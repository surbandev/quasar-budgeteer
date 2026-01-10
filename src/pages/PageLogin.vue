<template>
  <q-layout>
    <q-page-container>
      <q-page class="login-page flex flex-center">
        <!-- Background animations -->
        <div class="background-scene">
          <div class="stars"></div>

          <!-- Mathematical Equations Background -->
          <div class="math-equations">
            <div class="equation equation-1">∫ f(x)dx = F(x) + C</div>
            <div class="equation equation-2">e^(iπ) + 1 = 0</div>
            <div class="equation equation-3">∇ × E = -∂B/∂t</div>
            <div class="equation equation-4">∑(n=1→∞) 1/n² = π²/6</div>
            <div class="equation equation-5">φ = (1 + √5)/2</div>
            <div class="equation equation-6">∂²u/∂t² = c²∇²u</div>
            <div class="equation equation-7">∫₀^∞ e^(-x²)dx = √π/2</div>
            <div class="equation equation-8">ζ(s) = ∑(n=1→∞) 1/n^s</div>
            <div class="equation equation-9">∇ · E = ρ/ε₀</div>
            <div class="equation equation-10">Γ(n) = (n-1)!</div>
          </div>
        </div>

        <div class="app-title-container">
          <h1 class="app-title">Budgeteer</h1>
          <div class="title-subtitle">Smart Budget Management</div>
          <div class="beta-badge">
            <span class="beta-text">BETA</span>
          </div>
        </div>

        <div class="login-container">
          <q-form @submit="handleLogin" class="login-form">
            <div class="form-fields-stack">
              <div class="login-input-group">
                <label>Username</label>
                <q-input
                  v-model="username"
                  type="text"
                  placeholder="Enter username"
                  class="login-custom-input"
                  :class="{ 'input-error': usernameError }"
                  @update:model-value="clearUsernameError"
                  borderless
                  dense
                />
                <div v-if="usernameError" class="input-error-message">
                  <span>{{ usernameError }}</span>
                </div>
              </div>

              <div class="login-input-group">
                <label>Password</label>
                <q-input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Enter password"
                  class="login-custom-input"
                  :class="{ 'input-error': passwordError }"
                  @update:model-value="clearPasswordError"
                  borderless
                  dense
                >
                  <template v-slot:append>
                    <q-icon
                      :name="showPassword ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="showPassword = !showPassword"
                    />
                  </template>
                </q-input>
                <div v-if="passwordError" class="input-error-message">
                  <span>{{ passwordError }}</span>
                </div>
              </div>

              <div class="login-input-group options-group">
                <div class="options-row">
                  <q-checkbox
                    v-model="rememberMe"
                    label="Remember me"
                    class="remember-me-checkbox"
                    dense
                  />
                  <a href="#" class="forgot-link">Forgot Password?</a>
                </div>
              </div>
            </div>

            <div class="login-form-actions">
              <q-btn
                type="submit"
                class="login-button"
                :class="{ loading: isLoading }"
                :loading="isLoading"
                :disable="isLoading"
                unelevated
                no-caps
              >
                <span v-if="!isLoading">LOGIN</span>
              </q-btn>

              <div class="register-link">
                Don't have an account?
                <router-link to="/register">Register</router-link>
              </div>
            </div>
          </q-form>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useProfileStore } from '../stores/profile'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const $q = useQuasar()
const profileStore = useProfileStore()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const usernameError = ref('')
const passwordError = ref('')
const showPassword = ref(false)

function clearUsernameError() {
  usernameError.value = ''
}

function clearPasswordError() {
  passwordError.value = ''
}

function validateForm() {
  let isValid = true

  clearUsernameError()
  clearPasswordError()

  if (!username.value.trim()) {
    usernameError.value = 'Username is required'
    isValid = false
  } else if (username.value.trim().length < 3) {
    usernameError.value = 'Username must be at least 3 characters'
    isValid = false
  }

  if (!password.value) {
    passwordError.value = 'Password is required'
    isValid = false
  } else if (password.value.length < 5) {
    passwordError.value = 'Password must be at least 5 characters'
    isValid = false
  }

  return isValid
}

async function handleLogin() {
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  clearUsernameError()
  clearPasswordError()

  try {
    await authStore.login(username.value.trim(), password.value)

    try {
      await profileStore.fetchProfiles()
      const userID = authStore.getUserID
      const userProfile = profileStore.profiles.find((p) => p.id == userID || p._id == userID)
      if (userProfile) {
        profileStore.setCurrentProfile(userProfile)
      } else {
        profileStore.setCurrentProfile({ id: userID })
      }
    } catch (e) {
      console.error('Error setting current profile:', e)
      profileStore.setCurrentProfile({ id: authStore.getUserID })
    }

    router.push('/dashboard')
  } catch (error) {
    console.error('Login failed:', error)

    let message = 'Login failed. Please try again.'

    if (error.response) {
      const status = error.response.status
      switch (status) {
        case 401:
          message = 'Invalid username or password. Please try again.'
          break
        case 404:
          message = 'User not found. Please check your username.'
          break
        case 500:
          message = 'Server error. Please try again later.'
          break
        default:
          message = error.response.data?.message || message
      }
    } else if (error.request) {
      message = 'Network error. Please check your connection and try again.'
    }

    $q.notify({
      type: 'negative',
      message,
      position: 'top',
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.background-scene {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
}

.stars {
  display: none;
}

.math-equations {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.equation {
  position: absolute;
  font-family: 'Times New Roman', serif;
  font-size: 1.2rem;
  font-weight: 300;
  background: linear-gradient(
    135deg,
    #667eea 0%,
    #764ba2 25%,
    #f093fb 50%,
    #f5576c 75%,
    #4facfe 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0;
  transform: scale(0.8);
  white-space: nowrap;
  text-shadow:
    0 0 30px rgba(102, 126, 234, 0.6),
    0 0 40px rgba(118, 75, 162, 0.4),
    0 0 50px rgba(240, 147, 251, 0.3);
}

.equation-1 {
  top: 15%;
  left: 10%;
  animation: equationFade 8s ease-in-out infinite 0s;
}
.equation-2 {
  top: 25%;
  right: 15%;
  animation: equationFade 8s ease-in-out infinite 1s;
}
.equation-3 {
  top: 35%;
  left: 20%;
  animation: equationFade 8s ease-in-out infinite 2s;
}
.equation-4 {
  top: 45%;
  right: 25%;
  animation: equationFade 8s ease-in-out infinite 3s;
}
.equation-5 {
  top: 55%;
  left: 15%;
  animation: equationFade 8s ease-in-out infinite 4s;
}
.equation-6 {
  top: 65%;
  right: 20%;
  animation: equationFade 8s ease-in-out infinite 5s;
}
.equation-7 {
  top: 75%;
  left: 25%;
  animation: equationFade 8s ease-in-out infinite 6s;
}
.equation-8 {
  top: 85%;
  right: 15%;
  animation: equationFade 8s ease-in-out infinite 7s;
}
.equation-9 {
  top: 20%;
  left: 60%;
  animation: equationFade 8s ease-in-out infinite 0.5s;
}
.equation-10 {
  top: 70%;
  left: 50%;
  animation: equationFade 8s ease-in-out infinite 1.5s;
}

@keyframes equationFade {
  0% {
    opacity: 0;
    transform: scale(0.8) rotate(-2deg);
  }
  25% {
    opacity: 0.4;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1) rotate(1deg);
  }
  75% {
    opacity: 0.4;
    transform: scale(1) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: scale(0.8) rotate(-2deg);
  }
}

.app-title-container {
  position: absolute;
  top: 3%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 1;
  padding-top: 2rem;
  margin-bottom: 2rem;
  animation: fadeInDown 1s ease-out;
  width: 100%;
}

.app-title {
  font-size: 8rem;
  font-weight: 900;
  background: linear-gradient(
    135deg,
    #667eea 0%,
    #764ba2 25%,
    #f093fb 50%,
    #f5576c 75%,
    #4facfe 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 2rem 0;
  letter-spacing: 6px;
  position: relative;
  z-index: 10;
  animation: glow 2s ease-in-out infinite alternate;
  padding-bottom: 2rem;
  line-height: 1.1;
}

.app-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 6px;
  background: linear-gradient(
    90deg,
    transparent,
    #667eea,
    #764ba2,
    #f093fb,
    #f5576c,
    #4facfe,
    transparent
  );
  border-radius: 3px;
  animation: shimmer 3s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
}

@keyframes glow {
  from {
    filter: drop-shadow(0 0 20px rgba(102, 126, 234, 0.3));
  }
  to {
    filter: drop-shadow(0 0 30px rgba(102, 126, 234, 0.6));
  }
}

@keyframes shimmer {
  0%,
  100% {
    opacity: 0.6;
    transform: translateX(-50%) scaleX(0.8);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) scaleX(1.2);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.title-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 1.5rem;
  font-weight: 300;
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: 0.9;
  animation: fadeInUp 1s ease-out 0.5s both;
}

.beta-badge {
  display: inline-block;
  margin-top: 0.3rem;
  margin-bottom: 0;
  padding: 0.1rem 0;
  animation: fadeInUp 1s ease-out 0.7s both;
}

.beta-text {
  display: inline-block;
  background: linear-gradient(
    135deg,
    #ff6b6b 0%,
    #9c27b0 25%,
    #673ab7 50%,
    #3f51b5 75%,
    #2196f3 100%
  );
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  text-transform: uppercase;
  box-shadow:
    0 4px 15px rgba(156, 39, 176, 0.4),
    0 0 20px rgba(156, 39, 176, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
  animation: betaPulse 2s ease-in-out infinite;
}

.beta-text::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: betaShimmer 3s ease-in-out infinite;
}

@keyframes betaPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow:
      0 4px 15px rgba(156, 39, 176, 0.4),
      0 0 20px rgba(156, 39, 176, 0.2);
  }
  50% {
    transform: scale(1.05);
    box-shadow:
      0 6px 20px rgba(156, 39, 176, 0.6),
      0 0 30px rgba(156, 39, 176, 0.4);
  }
}

@keyframes betaShimmer {
  0% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
  100% {
    left: 100%;
  }
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 35vh;
  max-width: 550px;
  width: 100%;
  margin: 22rem auto 2rem;
  padding: 0 2rem;
  overflow: visible;
  z-index: 2;
}

.login-form {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 2rem;
}

.form-fields-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.login-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.login-input-group label {
  color: white;
  font-size: 1rem;
  font-weight: 500;
}

/* Override Quasar input styles */
.login-custom-input {
  width: 100%;
}

.login-custom-input :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 16px;
  min-height: 52px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.login-custom-input :deep(.q-field__control):before,
.login-custom-input :deep(.q-field__control):after {
  display: none;
}

.login-custom-input :deep(.q-field__native) {
  color: white;
  font-size: 1rem;
  padding: 0;
  min-height: auto;
  line-height: 1.5;
}

.login-custom-input :deep(.q-field__native)::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.login-custom-input :deep(.q-field__control):hover {
  border-color: rgba(255, 255, 255, 0.6);
}

.login-custom-input :deep(.q-field__append) {
  color: rgba(255, 255, 255, 0.7);
}

.login-custom-input :deep(.q-field__append .q-icon) {
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.2s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.9);
  }
}

.login-custom-input.q-field--focused :deep(.q-field__control) {
  border-color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.login-custom-input.input-error :deep(.q-field__control) {
  border-color: rgba(244, 67, 54, 0.5);
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.1);
}

.input-error-message {
  color: #ff6b6b;
  font-size: 0.8rem;
  padding: 0.5rem 0.75rem;
  background: rgba(244, 67, 54, 0.1);
  border-radius: 8px;
  border-left: 3px solid #ff6b6b;
}

.options-group {
  margin-top: 0.5rem;
}

.options-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
}

.remember-me input[type='checkbox'] {
  accent-color: #667eea;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Override Quasar checkbox styles */
.remember-me-checkbox {
  color: rgba(255, 255, 255, 0.8);
}

.remember-me-checkbox :deep(.q-checkbox__bg) {
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 3px;
}

.remember-me-checkbox :deep(.q-checkbox__inner) {
  color: rgba(255, 255, 255, 0.8);
}

.remember-me-checkbox.q-checkbox--truthy :deep(.q-checkbox__bg) {
  background: #667eea;
  border-color: #667eea;
}

.forgot-link {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.forgot-link:hover {
  color: white;
}

.login-form-actions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  margin-top: 1rem;
}

.login-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  height: 56px;
  font-weight: 600;
  border-radius: 12px;
  font-size: 1.1rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  width: 100%;
}

/* Override Quasar button styles */
.login-button.q-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  height: 56px;
  font-weight: 600;
  border-radius: 12px;
  font-size: 1.1rem;
  padding: 0;
  letter-spacing: 1px;
}

.login-button.q-btn :deep(.q-btn__content) {
  font-weight: 600;
  font-size: 1.1rem;
}

.login-button.q-btn:not(.loading):hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.login-button.loading {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  pointer-events: none;
}

.register-link {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.register-link a:hover {
  color: #764ba2;
}

@media (max-width: 768px) {
  .app-title {
    font-size: 6rem;
    letter-spacing: 4px;
  }

  .title-subtitle {
    font-size: 1rem;
  }

  .beta-text {
    font-size: 0.7rem;
  }

  .equation {
    font-size: 1rem;
  }

  .equation-1,
  .equation-2,
  .equation-9 {
    display: none;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 4.5rem;
    letter-spacing: 2px;
  }

  .beta-text {
    font-size: 0.65rem;
    padding: 0.25rem 0.7rem;
  }

  .equation {
    font-size: 0.9rem;
  }

  .login-card {
    margin: 0 1rem;
  }
}
</style>
