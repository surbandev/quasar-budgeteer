<template>
  <q-page class="settings-page">
    <div class="settings-container">
      <div class="settings-header q-mb-lg">
        <q-btn flat dense icon="arrow_back" label="Back" @click="goBack" no-caps />
        <h1 class="settings-title">User Settings</h1>
      </div>

      <q-card class="glass-card">
        <q-card-section>
          <q-form @submit="saveSettings" class="q-gutter-md">
            <div class="form-section">
              <h3 class="section-title">Account Information</h3>

              <q-input
                v-model="userSettings.username"
                label="Username"
                outlined
                dense
                readonly
              />

              <q-input
                v-model="userSettings.email"
                label="Email"
                type="email"
                outlined
                dense
              />
            </div>

            <div class="form-section">
              <h3 class="section-title">Change Password</h3>

              <q-input
                v-model="userSettings.currentPassword"
                label="Current Password"
                type="password"
                outlined
                dense
              />

              <q-input
                v-model="userSettings.newPassword"
                label="New Password"
                type="password"
                outlined
                dense
              />

              <q-input
                v-model="userSettings.confirmPassword"
                label="Confirm New Password"
                type="password"
                outlined
                dense
              />
            </div>

            <div class="form-section">
              <h3 class="section-title">Preferences</h3>

              <q-select
                v-model="userSettings.theme"
                :options="themeOptions"
                label="Theme"
                outlined
                dense
                emit-value
                map-options
              />

              <q-select
                v-model="userSettings.currency"
                :options="currencyOptions"
                label="Currency"
                outlined
                dense
                emit-value
                map-options
              />
            </div>

            <div class="form-actions">
              <q-btn
                type="submit"
                label="Save Changes"
                color="primary"
                :loading="isSaving"
                no-caps
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()

const isSaving = ref(false)

const userSettings = ref({
  username: localStorage.getItem('username') || '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  theme: 'dark',
  currency: 'USD',
})

const themeOptions = [
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
]

const currencyOptions = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
]

async function saveSettings() {
  isSaving.value = true
  try {
    // Implement save logic here
    await new Promise((resolve) => setTimeout(resolve, 1000))

    $q.notify({
      type: 'positive',
      message: 'Settings saved successfully',
      position: 'top',
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to save settings',
      position: 'top',
    })
  } finally {
    isSaving.value = false
  }
}

function goBack() {
  router.push('/dashboard')
}
</script>

<style scoped lang="scss">
.settings-page {
  padding: 2rem;
  min-height: 100vh;
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.settings-title {
  font-size: 2rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.form-section {
  padding: 1.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 1rem;
}

.form-actions {
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .settings-page {
    padding: 1rem;
  }
}
</style>
