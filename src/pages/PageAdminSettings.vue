<template>
  <q-page class="settings-page">
    <div class="background-scene">
      <div class="math-equations">
        <div class="equation equation-1">∫ f(x)dx = F(x) + C</div>
        <div class="equation equation-2">e^(iπ) + 1 = 0</div>
        <div class="equation equation-3">∇ × E = -∂B/∂t</div>
        <div class="equation equation-4">∑(n=1→∞) 1/n² = π²/6</div>
      </div>
    </div>

    <div class="settings-container">
      <h2 class="form-title">Admin Settings</h2>

      <q-inner-loading :showing="adminStore.loading" />

      <div class="users-section">
        <h3 class="section-title">Manage Users</h3>

        <div v-if="adminStore.users.length === 0 && !adminStore.loading" class="empty-state">
          No users found.
        </div>

        <div class="users-list">
          <div v-for="user in adminStore.users" :key="user.id" class="user-card">
            <div class="user-info">
              <q-icon name="admin_panel_settings" size="md" class="user-icon" />
              <div>
                <div class="user-name">{{ displayName(user) }}</div>
                <div class="user-meta">@{{ user.username }}</div>
                <div v-if="user.email" class="user-meta">{{ user.email }}</div>
              </div>
            </div>
            <div class="user-actions">
              <q-btn flat dense icon="edit" color="primary" @click="editUser(user)" />
              <q-btn
                flat
                dense
                icon="delete"
                class="delete-button"
                :disable="isProtectedUser(user)"
                @click="confirmDeleteUser(user)"
              />
            </div>
          </div>
        </div>

        <q-btn
          label="Add New User"
          icon="add"
          class="add-user-button"
          unelevated
          no-caps
          @click="openCreateDialog"
        />

        <q-btn
          label="Back to Tools"
          flat
          color="white"
          class="back-button"
          no-caps
          @click="router.push('/tools')"
        />
      </div>

      <q-dialog v-model="showUserDialog">
        <q-card class="dialog-card">
          <q-card-section>
            <div class="dialog-title">{{ editingUser ? 'Edit User' : 'Add New User' }}</div>
          </q-card-section>

          <q-card-section class="dialog-form">
            <div class="form-row">
              <q-input
                v-model="userForm.firstname"
                label="First Name"
                outlined
                dense
                dark
                class="dialog-input"
              />
              <q-input
                v-model="userForm.lastname"
                label="Last Name"
                outlined
                dense
                dark
                class="dialog-input"
              />
            </div>

            <q-input
              v-model="userForm.username"
              label="Username"
              outlined
              dense
              dark
              class="dialog-input"
              @update:model-value="handleUsernameInput"
            />

            <q-input
              v-model="userForm.email"
              label="Email"
              type="email"
              outlined
              dense
              dark
              class="dialog-input"
            />

            <q-input
              v-model="userForm.phone"
              label="Phone"
              outlined
              dense
              dark
              class="dialog-input"
            />

            <q-input
              v-model="userForm.password"
              :label="editingUser ? 'New Password (optional)' : 'Password'"
              :type="showPassword ? 'text' : 'password'"
              outlined
              dense
              dark
              class="dialog-input"
            >
              <template #append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>
          </q-card-section>

          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Cancel" color="white" no-caps @click="closeUserDialog" />
            <q-btn
              :label="editingUser ? 'Update' : 'Create'"
              color="primary"
              unelevated
              no-caps
              :loading="saving"
              @click="saveUser"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAdminStore } from '../stores/admin'
import { useAuthStore } from '../stores/auth'
import { isAdminUsername } from '../js/admin'

const router = useRouter()
const $q = useQuasar()
const adminStore = useAdminStore()
const authStore = useAuthStore()

const showUserDialog = ref(false)
const editingUser = ref(null)
const saving = ref(false)
const showPassword = ref(false)

const userForm = ref({
  firstname: '',
  lastname: '',
  username: '',
  email: '',
  phone: '',
  password: '',
})

function displayName(user) {
  const first = user.firstname || user.first_name || ''
  const last = user.lastname || user.last_name || ''
  const fullName = `${first} ${last}`.trim()
  return fullName || user.username
}

function isProtectedUser(user) {
  return isAdminUsername(user.username) || String(user.id) === String(authStore.getUserID)
}

function resetForm() {
  userForm.value = {
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    phone: '',
    password: '',
  }
}

function handleUsernameInput(value) {
  if (value) {
    userForm.value.username = value.toLowerCase()
  }
}

function openCreateDialog() {
  editingUser.value = null
  resetForm()
  showPassword.value = false
  showUserDialog.value = true
}

function editUser(user) {
  editingUser.value = user
  userForm.value = {
    firstname: user.firstname || user.first_name || '',
    lastname: user.lastname || user.last_name || '',
    username: user.username || '',
    email: user.email || '',
    phone: user.phone || '',
    password: '',
  }
  showPassword.value = false
  showUserDialog.value = true
}

function closeUserDialog() {
  showUserDialog.value = false
  editingUser.value = null
  resetForm()
}

async function saveUser() {
  if (!userForm.value.username.trim() || !userForm.value.email.trim()) {
    $q.notify({ type: 'negative', message: 'Username and email are required', position: 'top' })
    return
  }

  if (!editingUser.value && !userForm.value.password.trim()) {
    $q.notify({ type: 'negative', message: 'Password is required for new users', position: 'top' })
    return
  }

  if (!editingUser.value && (!userForm.value.firstname.trim() || !userForm.value.lastname.trim())) {
    $q.notify({
      type: 'negative',
      message: 'First and last name are required for new users',
      position: 'top',
    })
    return
  }

  saving.value = true
  try {
    if (editingUser.value) {
      await adminStore.updateUser({
        userID: editingUser.value.id,
        username: userForm.value.username.trim().toLowerCase(),
        email: userForm.value.email.trim(),
        password: userForm.value.password.trim() || undefined,
      })
      $q.notify({ type: 'positive', message: 'User updated', position: 'top' })
    } else {
      await adminStore.createUser({
        username: userForm.value.username.trim().toLowerCase(),
        password: userForm.value.password,
        firstname: userForm.value.firstname.trim(),
        lastname: userForm.value.lastname.trim(),
        phone: userForm.value.phone.trim(),
        email: userForm.value.email.trim(),
      })
      $q.notify({ type: 'positive', message: 'User created', position: 'top' })
    }
    closeUserDialog()
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.response?.statusText ||
      'Failed to save user'
    $q.notify({
      type: 'negative',
      message,
      position: 'top',
    })
  } finally {
    saving.value = false
  }
}

function confirmDeleteUser(user) {
  $q.dialog({
    title: 'Delete User',
    message: `Delete ${displayName(user)} (@${user.username})? This cannot be undone.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await adminStore.deleteUser(user.id)
      $q.notify({ type: 'positive', message: 'User deleted', position: 'top' })
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.response?.statusText || 'Failed to delete user',
        position: 'top',
      })
    }
  })
}

onMounted(async () => {
  if (!authStore.isAdmin) {
    router.push('/tools')
    return
  }

  try {
    await adminStore.fetchUsers()
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to load users', position: 'top' })
  }
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
  inset: 0;
  z-index: 0;
  background: var(--page-bg);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0;
}

.equation-1 { top: 15%; left: 10%; animation: equationFade 8s ease-in-out infinite 0s; }
.equation-2 { top: 25%; right: 15%; animation: equationFade 8s ease-in-out infinite 1s; }
.equation-3 { top: 65%; left: 15%; animation: equationFade 8s ease-in-out infinite 2s; }
.equation-4 { top: 85%; right: 15%; animation: equationFade 8s ease-in-out infinite 3s; }

@keyframes equationFade {
  0%, 100% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

.settings-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 720px;
  width: 100%;
  padding: 0 2rem 2rem;
  z-index: 2;
}

.form-title {
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 2rem;
  text-align: center;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.users-section {
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

.empty-state {
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  padding: 1rem;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(168, 85, 247, 0.35);
  border-radius: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.user-icon {
  color: rgba(255, 255, 255, 0.75);
}

.user-name {
  color: white;
  font-weight: 600;
}

.user-meta {
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.9rem;
}

.user-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.delete-button {
  color: #ef4444 !important;
}

.add-user-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
}

.back-button {
  align-self: center;
}

.dialog-card {
  background: rgba(30, 30, 35, 0.98);
  color: white;
  min-width: min(92vw, 520px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
}

.dialog-title {
  font-size: 1.35rem;
  font-weight: 600;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.dialog-actions {
  padding: 1rem 1rem 1rem;
}

@media (max-width: 600px) {
  .settings-container {
    padding: 0 1rem 1.5rem;
  }

  .form-title {
    font-size: 2rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .user-card {
    flex-direction: column;
    align-items: stretch;
  }

  .user-actions {
    justify-content: flex-end;
  }
}
</style>
