<template>
  <q-page class="settings-page">
    <!-- Background animations -->
    <div class="background-scene">
      <div class="stars"></div>

      <div class="math-equations">
        <div class="equation equation-1">∫ f(x)dx = F(x) + C</div>
        <div class="equation equation-2">e^(iπ) + 1 = 0</div>
        <div class="equation equation-3">∇ × E = -∂B/∂t</div>
        <div class="equation equation-4">∑(n=1→∞) 1/n² = π²/6</div>
      </div>
    </div>

    <div class="settings-container">
      <h2 class="form-title">User Settings</h2>

      <q-form @submit="saveSettings" class="settings-form">
        <div class="form-section">
          <h3 class="section-title">Account Information</h3>

          <div class="form-group">
            <label>Username</label>
            <q-input
              v-model="userSettings.username"
              type="text"
              placeholder="Username"
              class="form-input"
              borderless
              dense
              readonly
            />
          </div>

          <div class="form-group">
            <label>Email</label>
            <q-input
              v-model="userSettings.email"
              type="email"
              placeholder="Enter email address"
              class="form-input"
              borderless
              dense
            />
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">Change Password</h3>

          <div class="form-group">
            <label>Current Password</label>
            <q-input
              v-model="userSettings.currentPassword"
              :type="showCurrentPassword ? 'text' : 'password'"
              placeholder="Enter current password"
              class="form-input"
              borderless
              dense
            >
              <template v-slot:append>
                <q-icon
                  :name="showCurrentPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showCurrentPassword = !showCurrentPassword"
                />
              </template>
            </q-input>
          </div>

          <div class="form-group">
            <label>New Password</label>
            <q-input
              v-model="userSettings.newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              placeholder="Enter new password"
              class="form-input"
              borderless
              dense
            >
              <template v-slot:append>
                <q-icon
                  :name="showNewPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showNewPassword = !showNewPassword"
                />
              </template>
            </q-input>
          </div>

          <div class="form-group">
            <label>Confirm New Password</label>
            <q-input
              v-model="userSettings.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Confirm new password"
              class="form-input"
              borderless
              dense
            >
              <template v-slot:append>
                <q-icon
                  :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </q-input>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">Subscription Level</h3>

          <div class="subscription-toggle">
            <div
              class="subscription-option"
              :class="{ active: userSettings.subscriptionLevel === 'basic' }"
              @click="userSettings.subscriptionLevel = 'basic'"
            >
              <div class="option-title">Basic Plan</div>
              <div class="option-price">$4.99/month</div>
              <div class="option-features">
                <div class="feature-item">
                  <q-icon name="check_circle" class="feature-icon" />
                  <span>Up to 1 profile</span>
                </div>
                <div class="feature-item">
                  <q-icon name="check_circle" class="feature-icon" />
                  <span>Basic calendar features</span>
                </div>
                <div class="feature-item">
                  <q-icon name="check_circle" class="feature-icon" />
                  <span>Standard support</span>
                </div>
              </div>
            </div>

            <div
              class="subscription-option"
              :class="{ active: userSettings.subscriptionLevel === 'accountant' }"
              @click="userSettings.subscriptionLevel = 'accountant'"
            >
              <div class="option-title">Premium Plan</div>
              <div class="option-price">$9.99/month</div>
              <div class="option-features">
                <div class="feature-item">
                  <q-icon name="check_circle" class="feature-icon" />
                  <span>Unlimited profiles</span>
                </div>
                <div class="feature-item">
                  <q-icon name="check_circle" class="feature-icon" />
                  <span>Advanced calendar features</span>
                </div>
                <div class="feature-item">
                  <q-icon name="check_circle" class="feature-icon" />
                  <span>Priority support</span>
                </div>
              </div>
            </div>

            <div
              class="subscription-option"
              :class="{ active: userSettings.subscriptionLevel === 'cancel' }"
              @click="userSettings.subscriptionLevel = 'cancel'"
            >
              <div class="option-title">Cancel Plan</div>
              <div class="option-price">$0/month</div>
              <div class="option-features">
                <div class="feature-item">
                  <q-icon name="warning" class="feature-icon warning" />
                  <span>Access will cease at the end of your current pay period</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">Preferences</h3>

          <div class="form-group">
            <label>Theme</label>
            <q-select
              v-model="userSettings.theme"
              :options="themeOptions"
              option-label="label"
              option-value="value"
              class="form-input theme-select"
              borderless
              dense
              emit-value
              map-options
              dark
            />
          </div>
        </div>

        <div class="form-actions">
          <q-btn
            type="button"
            label="Cancel"
            @click="goBack"
            class="cancel-button"
            unelevated
            no-caps
          />
          <q-btn
            type="submit"
            label="Save Changes"
            :loading="isSaving"
            class="submit-button"
            unelevated
            no-caps
          />
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth'
import { useConstantsStore } from '../stores/constants'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const constantsStore = useConstantsStore()

const isSaving = ref(false)
const isLoading = ref(false)

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const userSettings = ref({
  username: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  theme: 'dark',
  subscriptionLevel: 'basic',
})

const themeOptions = computed(() => constantsStore.getThemeOptions)

async function loadUserSettings() {
  isLoading.value = true
  try {
    const userID = authStore.getUserID

    if (!authStore.isAuthenticated || !userID) {
      router.push('/login')
      return
    }

    const userResponse = await authStore.fetchUser(userID)

    if (userResponse?.user) {
      const user = userResponse.user
      userSettings.value.username = user.username || ''
      userSettings.value.email = user.email || ''
      userSettings.value.subscriptionLevel = user.subscriptionLevel || 'basic'
    }

    // Load theme from localStorage (like original app)
    const savedTheme = localStorage.getItem('theme') || 'dark'
    userSettings.value.theme = savedTheme
  } catch (error) {
    console.error('Error loading user settings:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load user settings',
      position: 'top',
    })
  } finally {
    isLoading.value = false
  }
}

async function saveSettings() {
  isSaving.value = true
  try {
    const userID = authStore.getUserID

    if (!authStore.isAuthenticated || !userID) {
      router.push('/login')
      return
    }

    // Validate that both password fields have values (like original app)
    if (!userSettings.value.newPassword.trim() || !userSettings.value.confirmPassword.trim()) {
      $q.notify({
        type: 'negative',
        message: 'Please enter both new password and confirm password to save your settings',
        position: 'top',
      })
      isSaving.value = false
      return
    }

    // Validate that passwords match
    if (userSettings.value.newPassword !== userSettings.value.confirmPassword) {
      $q.notify({
        type: 'negative',
        message: 'Passwords do not match',
        position: 'top',
      })
      isSaving.value = false
      return
    }

    const updateData = {
      username: userSettings.value.username,
      password: userSettings.value.newPassword,
      email: userSettings.value.email,
      subscriptionLevel: userSettings.value.subscriptionLevel,
    }

    await authStore.updateUser(userID, updateData)

    // Clear password fields after successful update
    userSettings.value.newPassword = ''
    userSettings.value.confirmPassword = ''
    localStorage.setItem('theme', userSettings.value.theme)

    $q.notify({
      type: 'positive',
      message: 'Settings updated successfully',
      position: 'top',
    })

    // Navigate back to tools page
    router.push('/tools')
  } catch (error) {
    console.error('Error saving settings:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to update settings',
      position: 'top',
    })
  } finally {
    isSaving.value = false
  }
}

function goBack() {
  router.push('/dashboard')
}

onMounted(async () => {
  await loadUserSettings()
})

// Watch theme changes and save to localStorage (like original app)
watch(
  () => userSettings.value.theme,
  (newTheme) => {
    localStorage.setItem('theme', newTheme)
  }
)
</script>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 1rem;
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
  top: 65%;
  left: 15%;
  animation: equationFade 8s ease-in-out infinite 2s;
}
.equation-4 {
  top: 85%;
  right: 15%;
  animation: equationFade 8s ease-in-out infinite 3s;
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

.settings-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  max-width: 600px;
  width: 100%;
  padding: 0 2rem 1.5rem;
  z-index: 2;
}

.form-title {
  color: white;
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 2rem 0;
  text-align: center;
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
}

.settings-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-of-type {
    border-bottom: none;
  }
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.5rem 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
}

.form-input {
  width: 100%;
}

.form-input :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  min-height: 46px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.form-input :deep(.q-field__control:hover) {
  border-color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.12);
}

.form-input :deep(.q-field__control:focus-within) {
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.form-input :deep(.q-field__native) {
  color: white;
  font-size: 1rem;
  padding: 0;
  line-height: 1.5;
}

.form-input :deep(.q-field__native::placeholder) {
  color: rgba(255, 255, 255, 0.5);
}

.form-input :deep(.q-field__messages) {
  color: rgba(255, 255, 255, 0.7) !important;
}

.form-input :deep(.q-field__hint) {
  color: rgba(255, 255, 255, 0.6) !important;
}

.form-input :deep(.q-field__append) {
  color: rgba(255, 255, 255, 0.7);
}

.form-input :deep(.q-field__append .q-icon) {
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.2s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.9);
  }
}

// Force q-select to match q-input size exactly
.theme-select {
  width: 100%;

  :deep(.q-field) {
    min-height: 46px !important;
    height: 46px !important;
    max-height: 46px !important;
  }

  :deep(.q-field__control) {
    min-height: 46px !important;
    height: 46px !important;
    max-height: 46px !important;
    padding: 0.75rem 1rem !important;
  }

  :deep(.q-field__inner) {
    min-height: 46px !important;
    max-height: 46px !important;
    height: 46px !important;
    padding: 0 !important;
  }

  :deep(.q-field__native) {
    min-height: auto !important;
    height: auto !important;
    padding: 0 !important;
    line-height: 1.5 !important;
  }

  :deep(.q-field__append) {
    min-width: auto !important;
    padding: 0 !important;
  }
}

// Subscription section styling
.subscription-toggle {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.subscription-option {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.5);
  }

  &.active {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.15);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }
}

.option-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
}

.option-price {
  font-size: 1.1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1rem;
}

.option-features {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;

  .feature-icon {
    color: #4caf50;
    font-size: 1.2rem;

    &.warning {
      color: #ff9800;
    }
  }
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-button,
.submit-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

.cancel-button {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.submit-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.submit-button :deep(.q-btn__content) {
  font-weight: 600;
  font-size: 1.1rem;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .settings-container {
    padding: 1rem;
  }

  .form-title {
    font-size: 2.25rem;
    margin-bottom: 1.5rem;
  }

  .settings-form {
    gap: 1.5rem;
  }
}
</style>
