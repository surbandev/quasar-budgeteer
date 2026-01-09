<template>
  <q-page class="settings-page">
    <div class="settings-container">
      <div class="settings-header q-mb-lg">
        <q-btn flat dense icon="arrow_back" label="Back" @click="goBack" no-caps />
        <h1 class="settings-title">Profile Settings</h1>
      </div>

      <q-card class="glass-card q-mb-lg">
        <q-card-section>
          <h3 class="section-title">Manage Profiles</h3>

          <div class="profiles-list q-mb-md">
            <div
              v-for="profile in profiles"
              :key="profile.id"
              class="profile-card"
              :class="{ active: profile.id === currentProfile?.id }"
            >
              <div class="profile-info">
                <q-icon name="person" size="md" class="profile-icon" />
                <div>
                  <div class="profile-name">
                    {{ profile.first_name }} {{ profile.last_name }}
                  </div>
                  <div class="profile-meta">Profile ID: {{ profile.id }}</div>
                </div>
              </div>
              <div class="profile-actions">
                <q-btn
                  flat
                  dense
                  icon="edit"
                  color="primary"
                  @click="editProfile(profile)"
                />
                <q-btn
                  flat
                  dense
                  icon="delete"
                  color="negative"
                  @click="confirmDeleteProfile(profile)"
                />
              </div>
            </div>
          </div>

          <q-btn
            label="Add New Profile"
            icon="add"
            color="primary"
            @click="showAddDialog = true"
            no-caps
          />
        </q-card-section>
      </q-card>

      <!-- Add/Edit Profile Dialog -->
      <q-dialog v-model="showAddDialog">
        <q-card class="glass-card" style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">
              {{ editingProfile ? 'Edit Profile' : 'Add New Profile' }}
            </div>
          </q-card-section>

          <q-card-section>
            <q-form @submit="saveProfile" class="q-gutter-md">
              <q-input
                v-model="profileForm.first_name"
                label="First Name"
                outlined
                dense
                required
              />

              <q-input
                v-model="profileForm.last_name"
                label="Last Name"
                outlined
                dense
                required
              />

              <div class="row q-col-gutter-sm q-mt-md">
                <div class="col">
                  <q-btn
                    label="Cancel"
                    flat
                    @click="closeDialog"
                    no-caps
                  />
                </div>
                <div class="col">
                  <q-btn
                    type="submit"
                    label="Save"
                    color="primary"
                    class="full-width"
                    :loading="isSaving"
                    no-caps
                  />
                </div>
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
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useProfileStore } from '../stores/profile'

const router = useRouter()
const $q = useQuasar()
const profileStore = useProfileStore()

const showAddDialog = ref(false)
const isSaving = ref(false)
const editingProfile = ref(null)

const profileForm = ref({
  first_name: '',
  last_name: '',
})

const profiles = computed(() => profileStore.profiles)
const currentProfile = computed(() => profileStore.currentProfile)

function editProfile(profile) {
  editingProfile.value = profile
  profileForm.value = {
    first_name: profile.first_name,
    last_name: profile.last_name,
  }
  showAddDialog.value = true
}

async function saveProfile() {
  isSaving.value = true
  try {
    if (editingProfile.value) {
      await profileStore.updateProfile({
        id: editingProfile.value.id,
        ...profileForm.value,
      })
      $q.notify({
        type: 'positive',
        message: 'Profile updated successfully',
        position: 'top',
      })
    } else {
      await profileStore.addProfile(profileForm.value)
      $q.notify({
        type: 'positive',
        message: 'Profile added successfully',
        position: 'top',
      })
    }
    closeDialog()
  } catch (error) {
    console.error('Error saving profile:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to save profile',
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
      $q.notify({
        type: 'positive',
        message: 'Profile deleted successfully',
        position: 'top',
      })
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
  }
}

function goBack() {
  router.push('/dashboard')
}

onMounted(async () => {
  await profileStore.fetchProfiles()
})
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

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 1rem;
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
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    border-color: #4caf50;
    background: rgba(76, 175, 80, 0.1);
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
  color: rgba(255, 255, 255, 0.9);
}

.profile-meta {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.profile-actions {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .settings-page {
    padding: 1rem;
  }
}
</style>
