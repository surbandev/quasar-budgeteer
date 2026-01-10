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
      <h2 class="form-title">Profile Settings</h2>

      <div class="profiles-section">
        <h3 class="section-title">Manage Profiles</h3>

        <div class="profiles-list">
          <div
            v-for="profile in profiles"
            :key="profile.id"
            class="profile-card"
            :class="{ active: profile.id === currentProfile?.id }"
          >
            <div class="profile-info">
              <q-icon name="person" size="md" class="profile-icon" />
              <div>
                <div class="profile-name">{{ profile.first_name }} {{ profile.last_name }}</div>
              </div>
            </div>
            <div class="profile-actions">
              <q-btn flat dense icon="edit" color="primary" @click="editProfile(profile)" />
              <q-btn
                flat
                dense
                icon="delete"
                class="delete-button"
                @click="confirmDeleteProfile(profile)"
              />
            </div>
          </div>
        </div>

        <q-btn
          label="Add New Profile"
          icon="add"
          @click="showAddDialog = true"
          class="add-profile-button"
          unelevated
          no-caps
        />
      </div>

      <!-- Add/Edit Profile Dialog -->
      <q-dialog v-model="showAddDialog">
        <q-card class="dialog-card">
          <q-card-section>
            <div class="dialog-title">
              {{ editingProfile ? 'Edit Profile' : 'Add New Profile' }}
            </div>
          </q-card-section>

          <q-card-section>
            <q-form @submit="saveProfile" class="profile-form">
              <div class="form-group">
                <label>First Name</label>
                <q-input
                  v-model="profileForm.first_name"
                  type="text"
                  placeholder="Enter first name"
                  class="form-input"
                  borderless
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Last Name</label>
                <q-input
                  v-model="profileForm.last_name"
                  type="text"
                  placeholder="Enter last name"
                  class="form-input"
                  borderless
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Email</label>
                <q-input
                  v-model="profileForm.email"
                  type="email"
                  placeholder="Enter email address"
                  class="form-input"
                  borderless
                  dense
                />
              </div>

              <div class="form-group">
                <label>Phone Number</label>
                <q-input
                  v-model="profileForm.phone_number"
                  type="tel"
                  placeholder="Enter phone number"
                  class="form-input"
                  borderless
                  dense
                />
              </div>

              <div class="form-actions">
                <q-btn
                  type="button"
                  label="Cancel"
                  @click="closeDialog"
                  class="cancel-button"
                  unelevated
                  no-caps
                />
                <q-btn
                  type="submit"
                  label="Save"
                  :loading="isSaving"
                  class="submit-button"
                  unelevated
                  no-caps
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useProfileStore } from '../stores/profile'

const $q = useQuasar()
const profileStore = useProfileStore()

const showAddDialog = ref(false)
const isSaving = ref(false)
const editingProfile = ref(null)

const profileForm = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
})

const profiles = computed(() => profileStore.profiles)
const currentProfile = computed(() => profileStore.currentProfile)

function editProfile(profile) {
  editingProfile.value = profile
  profileForm.value = {
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    email: profile.email || '',
    phone_number: profile.phone || '', // Backend returns 'phone', not 'phone_number'
  }
  showAddDialog.value = true
}

async function saveProfile() {
  isSaving.value = true
  try {
    // Build profile data - include all fields that are populated
    // Backend expects: first_name, last_name, phone (not phone_number), email
    const profileData = {
      first_name: profileForm.value.first_name.trim(),
      last_name: profileForm.value.last_name.trim(),
    }

    // Include email if it's populated
    if (profileForm.value.email?.trim()) {
      profileData.email = profileForm.value.email.trim()
    }

    // Include phone (backend expects 'phone', not 'phone_number') if it's populated
    if (profileForm.value.phone_number?.trim()) {
      profileData.phone = profileForm.value.phone_number.trim()
    }

    if (editingProfile.value) {
      await profileStore.updateProfile({
        id: editingProfile.value.id,
        ...profileData,
      })
      $q.notify({
        type: 'positive',
        message: 'Profile updated successfully',
        position: 'top',
      })
    } else {
      await profileStore.addProfile(profileData)
      $q.notify({
        type: 'positive',
        message: 'Profile added successfully',
        position: 'top',
      })
    }
    closeDialog()
  } catch (error) {
    console.error('Error saving profile:', error)
    let errorMessage = 'Failed to save profile'

    // Provide more specific error message if available
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.status === 500) {
      errorMessage = 'Server error. Please try again.'
    }

    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
    })
  } finally {
    isSaving.value = false
  }
}

function confirmDeleteProfile(profile) {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete ${profile.first_name} ${profile.last_name}?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await profileStore.deleteProfile(profile.id)
    } catch (error) {
      console.error('Error deleting profile:', error)
      $q.notify({
        type: 'negative',
        message: 'Failed to delete profile',
        position: 'top',
      })
    }
  })
}

function closeDialog() {
  showAddDialog.value = false
  editingProfile.value = null
  profileForm.value = {
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
  }
}

onMounted(async () => {
  await profileStore.fetchProfiles()
})
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

.profiles-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.profiles-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.7);
    background: rgba(255, 255, 255, 0.12);
  }

  &.active {
    border-color: #4caf50;
    background: rgba(76, 175, 80, 0.15);
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
  }
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile-icon {
  color: rgba(255, 255, 255, 0.7);
}

.profile-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
}

.profile-meta {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.profile-actions {
  display: flex;
  gap: 0.5rem;
}

.delete-button {
  color: white !important;

  :deep(.q-icon) {
    color: white !important;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.add-profile-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;

  :deep(.q-btn__content) {
    font-weight: 600;
    font-size: 1.1rem;
  }

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
}

// Dialog styling
.dialog-card {
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  min-width: 600px;
  max-width: 700px;
  padding: 2.5rem;

  :deep(.q-card__section) {
    padding: 0;

    &:first-child {
      padding-bottom: 1.5rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  }
}

.dialog-title {
  color: white;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
}

.profile-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

  .dialog-card {
    min-width: 90vw;
    max-width: 90vw;
    padding: 1.5rem;

    .dialog-title {
      font-size: 1.5rem;
    }
  }
}
</style>

<style lang="scss">
// Global styles for delete confirmation dialog
.q-dialog {
  .q-dialog__inner {
    .q-card {
      background: rgba(30, 30, 30, 0.95) !important;
      backdrop-filter: blur(20px) !important;
      border: 2px solid rgba(255, 255, 255, 0.2) !important;
      border-radius: 16px !important;
      color: white !important;
      padding: 2rem !important;
      min-width: 400px;
      max-width: 500px;

      .q-card__section {
        color: white !important;
        padding: 0 !important;

        &:first-child {
          padding-bottom: 1rem !important;
          margin-bottom: 1rem !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
      }

      .q-dialog__title {
        color: white !important;
        font-size: 1.5rem !important;
        font-weight: 600 !important;
        margin: 0 0 1rem 0 !important;
      }

      .q-dialog__message {
        color: rgba(255, 255, 255, 0.9) !important;
        font-size: 1rem !important;
        line-height: 1.5 !important;
        margin-bottom: 1.5rem !important;
      }

      .q-dialog__actions {
        display: flex !important;
        gap: 1rem !important;
        justify-content: flex-end !important;
        padding-top: 1rem !important;
        border-top: 1px solid rgba(255, 255, 255, 0.1) !important;

        .q-btn {
          padding: 0.75rem 1.5rem !important;
          border-radius: 12px !important;
          font-size: 1rem !important;
          font-weight: 500 !important;
          transition: all 0.3s ease !important;

          &.q-btn--flat {
            background: rgba(255, 255, 255, 0.1) !important;
            border: 2px solid rgba(255, 255, 255, 0.3) !important;
            color: white !important;

            &:hover {
              background: rgba(255, 255, 255, 0.15) !important;
              border-color: rgba(255, 255, 255, 0.5) !important;
              transform: translateY(-2px) !important;
            }
          }

          &:not(.q-btn--flat) {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border: none !important;
            color: white !important;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;

            &:hover {
              transform: translateY(-3px) !important;
              box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4) !important;
            }
          }
        }
      }
    }
  }
}
</style>
