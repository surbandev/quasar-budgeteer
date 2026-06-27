<template>
  <q-page class="tools-page">
    <AppHeader variant="neutral" title="Tools" gear-to="/user-settings" />

    <div class="tools-container">
      <!-- Profile summary card -->
      <button type="button" class="profile-card" @click="goToProfileSettings">
        <span class="profile-avatar">
          <q-icon name="person" size="32px" />
        </span>
        <span class="profile-meta">
          <span class="profile-name">{{ userName }}</span>
          <span class="profile-tier">{{ accountTier }}</span>
        </span>
        <q-icon name="chevron_right" size="22px" class="profile-chevron" />
      </button>

      <!-- Buddy-style card grid -->
      <div class="tools-grid">
        <button
          v-for="card in cards"
          :key="card.key"
          type="button"
          class="tool-card"
          @click="card.action"
        >
          <span class="tool-chip" :style="{ background: card.color }">
            <q-icon :name="card.icon" size="24px" />
          </span>
          <span class="tool-title">{{ card.title }}</span>
          <span class="tool-desc">{{ card.desc }}</span>
        </button>
      </div>

      <p class="tools-version">Version: {{ appVersion }}</p>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'
import { useCalendarStore } from '../stores/calendar'
import { useOverviewStore } from '../stores/overview'
import AppHeader from '../components/AppHeader.vue'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const calendarStore = useCalendarStore()
const overviewStore = useOverviewStore()

const isAdmin = computed(() => authStore.isAdmin)
const appVersion = '0.0.1'

const userName = computed(() => {
  const user = authStore.currentUser
  if (!user) return 'Your Account'
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
  return user.first_name || user.username || user.email || 'Your Account'
})

const accountTier = computed(() => (isAdmin.value ? 'ADMIN ACCOUNT' : 'BASIC ACCOUNT'))

// Buddy-style tool cards. Each colored chip mirrors Buddy's icon tiles.
const cards = computed(() => {
  const list = [
    {
      key: 'profile',
      title: 'Profile Settings',
      desc: 'Manage your profile details',
      icon: 'person',
      color: '#3b82f6',
      action: goToProfileSettings,
    },
    {
      key: 'user',
      title: 'User Settings',
      desc: 'Appearance, themes and preferences',
      icon: 'tune',
      color: '#84cc16',
      action: goToUserSettings,
    },
    {
      key: 'feedback',
      title: 'Feedback',
      desc: "We'd love to hear what's on your mind",
      icon: 'chat_bubble',
      color: '#2fb38a',
      action: goToFeedback,
    },
    {
      key: 'weave',
      title: 'Weave',
      desc: 'Visualize and weave your plans together',
      icon: 'auto_awesome',
      color: '#a855f7',
      action: goToWeave,
    },
  ]

  if (isAdmin.value) {
    list.push({
      key: 'admin',
      title: 'Admin Settings',
      desc: 'Administrative controls and tools',
      icon: 'admin_panel_settings',
      color: '#ec4899',
      action: goToAdminSettings,
    })
  }

  list.push({
    key: 'logout',
    title: 'Sign Out',
    desc: 'Sign out of your current session',
    icon: 'logout',
    color: '#ef4444',
    action: confirmLogout,
  })

  return list
})

onMounted(async () => {
  if (!authStore.currentUser && authStore.getUserID) {
    try {
      await authStore.fetchUser(authStore.getUserID)
    } catch (error) {
      console.warn('Could not load user for admin tools check:', error)
    }
  }
})

function goToFeedback() {
  router.push('/feedback')
}

function goToProfileSettings() {
  router.push('/profile-settings')
}

function goToUserSettings() {
  router.push('/user-settings')
}

function goToWeave() {
  router.push('/weave')
}

function goToAdminSettings() {
  router.push('/admin-settings')
}

function confirmLogout() {
  $q.dialog({
    title: 'Sign Out',
    message: 'Are you sure you want to sign out of your session?',
    cancel: true,
    persistent: true,
    color: 'primary',
  }).onOk(async () => {
    try {
      await authStore.logout()
      profileStore.resetCurrentProfile()
      calendarStore.resetForNewUser()
      overviewStore.clear()
      router.push('/login')
    } catch (error) {
      console.error('Error during logout:', error)
      router.push('/login')
    }
  })
}
</script>

<style scoped lang="scss">
.tools-page {
  padding: 0;
  min-height: 100vh;
  background: var(--page-bg);
}

.tools-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.1rem 1rem 6rem;
}

.profile-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
  border: 1px solid var(--buddy-hairline);
  background: var(--buddy-surface);
  border-radius: var(--buddy-card-radius);
  padding: 1.1rem 1.2rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    background: var(--buddy-surface-2);
  }
}

.profile-avatar {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--buddy-surface-inset);
  color: rgba(255, 255, 255, 0.65);
}

.profile-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--buddy-text);
}

.profile-tier {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--buddy-text-dim);
}

.profile-chevron {
  color: var(--buddy-text-faint);
  flex-shrink: 0;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
}

.tool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.55rem;
  border: 1px solid var(--buddy-hairline);
  background: var(--buddy-surface);
  border-radius: var(--buddy-card-radius);
  padding: 1.4rem 1rem 1.5rem;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    background: var(--buddy-surface-2);
  }
}

.tool-chip {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 0.35rem;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
}

.tool-title {
  font-size: 1.02rem;
  font-weight: 700;
  color: var(--buddy-text);
}

.tool-desc {
  font-size: 0.82rem;
  line-height: 1.25;
  color: var(--buddy-text-dim);
}

.tools-version {
  text-align: center;
  color: var(--buddy-text-faint);
  font-size: 0.85rem;
  margin: 1.75rem 0 0;
}

@media (max-width: 360px) {
  .tools-grid {
    grid-template-columns: 1fr;
  }
}
</style>
