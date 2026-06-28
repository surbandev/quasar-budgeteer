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

      <q-tabs
        v-model="activeTab"
        class="admin-tabs"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        no-caps
        dense
      >
        <q-tab name="users" icon="group" label="Users" />
        <q-tab name="feedback" icon="forum" label="Feedback" />
        <q-tab name="logs" icon="receipt_long" label="Logs" />
      </q-tabs>

      <q-tab-panels v-model="activeTab" class="admin-tab-panels" animated keep-alive>
        <!-- Users -->
        <q-tab-panel name="users" class="admin-tab-panel">
          <div class="users-section">
            <div class="section-header">
              <h3 class="section-title">Manage Users</h3>
            </div>

            <q-inner-loading :showing="adminStore.loading" />

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
          </div>
        </q-tab-panel>

        <!-- Feedback -->
        <q-tab-panel name="feedback" class="admin-tab-panel">
          <div class="section-header">
            <h3 class="section-title">Feedback Received</h3>
            <q-btn
              flat
              dense
              round
              icon="refresh"
              color="white"
              :loading="adminStore.feedbackLoading"
              @click="loadFeedback"
            />
          </div>

          <q-inner-loading :showing="adminStore.feedbackLoading" />

          <div
            v-if="adminStore.feedback.length === 0 && !adminStore.feedbackLoading"
            class="empty-state"
          >
            No feedback yet.
          </div>

          <div class="feedback-list">
            <div v-for="(item, idx) in adminStore.feedback" :key="item.id || idx" class="feedback-card">
              <div class="feedback-head">
                <span class="feedback-type" :class="`type-${(item.type || 'general').toLowerCase()}`">
                  {{ item.type || 'general' }}
                </span>
                <span class="feedback-date">{{ formatDate(item.submittedAt) }}</span>
              </div>
              <div class="feedback-message">{{ item.message }}</div>
              <div class="feedback-user">
                {{ item.displayName || 'Unknown user'
                }}<span v-if="item.username"> (@{{ item.username }})</span>
              </div>
            </div>
          </div>
        </q-tab-panel>

        <!-- Logs -->
        <q-tab-panel name="logs" class="admin-tab-panel">
          <div class="section-header">
            <h3 class="section-title">Logs</h3>
            <q-btn
              flat
              dense
              round
              icon="refresh"
              color="white"
              :loading="adminStore.logsLoading"
              @click="loadLogs"
            />
          </div>

          <div class="log-filters">
            <q-btn
              v-for="filter in logFilters"
              :key="filter.value"
              :label="filter.label"
              :outline="logCategory !== filter.value"
              :unelevated="logCategory === filter.value"
              color="primary"
              size="sm"
              no-caps
              class="log-filter-btn"
              @click="setLogCategory(filter.value)"
            />
          </div>

          <q-inner-loading :showing="adminStore.logsLoading" />

          <div v-if="adminStore.logs.length === 0 && !adminStore.logsLoading" class="empty-state">
            No log entries.
          </div>

          <div class="logs-list">
            <div v-for="(log, idx) in adminStore.logs" :key="log.id || idx" class="log-card">
              <q-icon
                :name="logIcon(log.category)"
                :color="logColor(log.category)"
                size="20px"
                class="log-icon"
              />
              <div class="log-body">
                <div class="log-message">{{ log.message }}</div>
                <div v-if="log.detail" class="log-detail">{{ formatDetail(log.detail) }}</div>
                <div class="log-meta">
                  <span class="log-category">{{ log.category }}</span>
                  <span class="log-date">{{ formatDate(log.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>

      <q-btn
        label="Back to Tools"
        flat
        color="white"
        class="back-button"
        no-caps
        @click="router.push('/tools')"
      />

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
import { ref, watch, onMounted } from 'vue'
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

const activeTab = ref('users')
const logCategory = ref('')
const feedbackLoaded = ref(false)

const logFilters = [
  { label: 'All', value: '' },
  { label: 'Errors', value: 'ERROR' },
  { label: 'Emails', value: 'EMAIL' },
  { label: 'Requests', value: 'ACCOUNT_REQUEST' },
]

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

function formatDetail(detail) {
  if (detail == null) return ''
  try {
    const parsed = typeof detail === 'string' ? JSON.parse(detail) : detail
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed)
        .map(([key, val]) => `${key}: ${val}`)
        .join('  •  ')
    }
  } catch {
    /* not JSON, show as-is */
  }
  return String(detail)
}

function logIcon(category) {
  switch (category) {
    case 'ERROR':
      return 'error'
    case 'EMAIL':
      return 'mail'
    case 'ACCOUNT_REQUEST':
      return 'person_add'
    default:
      return 'info'
  }
}

function logColor(category) {
  switch (category) {
    case 'ERROR':
      return 'negative'
    case 'EMAIL':
      return 'info'
    case 'ACCOUNT_REQUEST':
      return 'positive'
    default:
      return 'grey-5'
  }
}

async function loadFeedback() {
  try {
    await adminStore.fetchFeedback()
    feedbackLoaded.value = true
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to load feedback', position: 'top' })
  }
}

async function loadLogs() {
  try {
    await adminStore.fetchLogs(logCategory.value || undefined)
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to load logs', position: 'top' })
  }
}

function setLogCategory(value) {
  logCategory.value = value
  loadLogs()
}

watch(activeTab, (tab) => {
  if (tab === 'feedback' && !feedbackLoaded.value) {
    loadFeedback()
  } else if (tab === 'logs' && adminStore.logs.length === 0) {
    loadLogs()
  }
})

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
  overflow-x: hidden;
  overflow-y: auto;
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

.admin-tabs {
  width: 100%;
  color: white;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  margin-bottom: 1.25rem;
}

.admin-tab-panels {
  width: 100%;
  background: transparent;
  color: white;
}

.admin-tab-panel {
  padding: 0;
  position: relative;
  min-height: 120px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-header .section-title {
  margin: 0;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feedback-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
}

.feedback-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.feedback-type {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: rgba(102, 126, 234, 0.25);
  color: #c7d2fe;
}

.feedback-type.type-bug {
  background: rgba(239, 68, 68, 0.22);
  color: #fca5a5;
}

.feedback-type.type-feature {
  background: rgba(16, 185, 129, 0.22);
  color: #6ee7b7;
}

.feedback-date,
.log-date {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.55);
}

.feedback-message {
  color: white;
  font-size: 0.95rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.feedback-user {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.log-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.log-filter-btn {
  border-radius: 999px;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.log-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.log-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.log-body {
  min-width: 0;
  flex: 1;
}

.log-message {
  color: white;
  font-size: 0.92rem;
  word-break: break-word;
}

.log-detail {
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.82rem;
  margin-top: 0.2rem;
  word-break: break-word;
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.35rem;
}

.log-category {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
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
