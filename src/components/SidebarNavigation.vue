<template>
  <div class="sidebar" :class="{ 'sidebar-mobile-open': mobileSidebarOpen }">
    <div class="sidebar-header">
      <div v-if="currentProfile" class="profile-info">
        <q-icon name="person" class="profile-icon" size="md" />
        <div class="profile-details">
          <h3>{{ currentProfile.first_name }} {{ currentProfile.last_name }}</h3>
          <p>Budget Dashboard</p>
        </div>
      </div>
    </div>

    <div class="sidebar-content">
      <!-- Navigation Section -->
      <div class="nav-section" :class="{ collapsed: !navigationExpanded }">
        <div class="nav-section-header" @click="toggleNavigation">
          <h4 class="nav-section-title">Navigation</h4>
          <q-icon
            name="expand_more"
            class="nav-section-toggle"
            :class="{ rotated: navigationExpanded }"
          />
        </div>
        <transition name="expand">
          <div v-if="navigationExpanded" class="nav-items">
            <div
              class="nav-item"
              :class="{ active: $route.name === 'Dashboard' }"
              @click="goToDashboard"
            >
              <q-icon name="dashboard" class="nav-icon" />
              <span class="nav-label">Dashboard</span>
            </div>

            <div
              class="nav-item"
              :class="{ active: $route.name === 'Calendar' }"
              @click="goToCalendar"
            >
              <q-icon name="calendar_month" class="nav-icon" />
              <span class="nav-label">Calendar</span>
            </div>

            <div
              class="nav-item"
              :class="{ active: $route.name === 'Transaction' }"
              @click="addTransaction"
            >
              <q-icon name="add_circle" class="nav-icon" />
              <span class="nav-label">Add Transaction</span>
            </div>

            <div
              class="nav-item"
              :class="{ active: $route.name === 'Feedback' }"
              @click="goToFeedback"
            >
              <q-icon name="chat_bubble" class="nav-icon" />
              <span class="nav-label">Feedback</span>
            </div>
          </div>
        </transition>
      </div>

      <!-- Profiles Section -->
      <div class="nav-section" :class="{ collapsed: !profilesExpanded }">
        <div class="nav-section-header" @click="toggleProfiles">
          <h4 class="nav-section-title">Profiles</h4>
          <q-icon
            name="expand_more"
            class="nav-section-toggle"
            :class="{ rotated: profilesExpanded }"
          />
        </div>
        <transition name="expand">
          <div v-if="profilesExpanded" class="nav-items">
            <div class="profile-list">
              <div
                v-for="profile in sortedProfiles"
                :key="profile.id || profile._id"
                class="profile-item"
                :class="{
                  'active-profile':
                    profile.id === currentProfile?.id || profile._id === currentProfile?.id,
                }"
                @click="selectProfile(profile)"
              >
                <q-icon name="person" class="profile-item-icon" />
                <span class="profile-item-label"
                  >{{ profile.first_name }} {{ profile.last_name }}</span
                >
              </div>
              <div v-if="sortedProfiles.length === 0" class="no-profiles">
                <span class="no-profiles-text">No profiles available</span>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Settings Section -->
      <div class="nav-section" :class="{ collapsed: !settingsExpanded }">
        <div class="nav-section-header" @click="toggleSettings">
          <h4 class="nav-section-title">Settings</h4>
          <q-icon
            name="expand_more"
            class="nav-section-toggle"
            :class="{ rotated: settingsExpanded }"
          />
        </div>
        <transition name="expand">
          <div v-if="settingsExpanded" class="nav-items">
            <div
              class="nav-item"
              :class="{ active: $route.name === 'UserSettings' }"
              @click="goToUserSettings"
            >
              <q-icon name="person" class="nav-icon" />
              <span class="nav-label">User Settings</span>
            </div>

            <div
              class="nav-item"
              :class="{ active: $route.name === 'ProfileSettings' }"
              @click="goToProfileSettings"
            >
              <q-icon name="people" class="nav-icon" />
              <span class="nav-label">Profile Settings</span>
            </div>
          </div>
        </transition>
      </div>

      <div class="sidebar-footer">
        <div class="nav-item logout-item" @click="handleLogout">
          <q-icon name="logout" class="nav-icon" />
          <span class="nav-label">Sign Out</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '../stores/profile'
import { useCalendarStore } from '../stores/calendar'

const router = useRouter()
const profileStore = useProfileStore()
const calendarStore = useCalendarStore()

defineProps({
  mobileSidebarOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close-sidebar'])

const navigationExpanded = ref(true)
const profilesExpanded = ref(false)
const settingsExpanded = ref(false)

const currentProfile = computed(() => profileStore.currentProfile)
const profiles = computed(() => profileStore.profiles)

const sortedProfiles = computed(() => {
  if (!profiles.value) return []

  const sorted = [...profiles.value]

  if (currentProfile.value) {
    sorted.sort((a, b) => {
      if (a.id === currentProfile.value.id || a._id === currentProfile.value.id) return -1
      if (b.id === currentProfile.value.id || b._id === currentProfile.value.id) return 1
      return 0
    })
  }

  return sorted
})

function toggleNavigation() {
  navigationExpanded.value = !navigationExpanded.value
}

function toggleProfiles() {
  profilesExpanded.value = !profilesExpanded.value
}

function toggleSettings() {
  settingsExpanded.value = !settingsExpanded.value
}

function goToDashboard() {
  router.push('/dashboard')
  emit('close-sidebar')
}

function goToCalendar() {
  if (!currentProfile.value) {
    console.warn('No current profile available for calendar navigation')
    return
  }
  router.push({
    path: '/calendar',
    query: { profileID: currentProfile.value.id },
  })
  emit('close-sidebar')
}

function addTransaction() {
  if (!currentProfile.value) {
    console.warn('No current profile available for adding transaction')
    return
  }
  router.push({
    path: '/transaction',
    query: { profileID: currentProfile.value.id },
  })
  emit('close-sidebar')
}

function goToUserSettings() {
  router.push('/user-settings')
  emit('close-sidebar')
}

function goToProfileSettings() {
  router.push('/profile-settings')
  emit('close-sidebar')
}

function goToFeedback() {
  router.push('/feedback')
  emit('close-sidebar')
}

async function selectProfile(profile) {
  try {
    console.log('Selecting profile:', profile)
    await profileStore.setCurrentProfile(profile)

    if (router.currentRoute.value.name === 'Dashboard') {
      // If already on dashboard, use event bus to trigger refresh
      if (window.$eventBus) {
        window.$eventBus.emit('profile-changed', profile)
      }
      router.replace('/dashboard')
    } else {
      router.push('/dashboard')
    }
    emit('close-sidebar')
  } catch (error) {
    console.error('Error selecting profile:', error)
  }
}

async function handleLogout() {
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('userID')
    await profileStore.resetCurrentProfile()
    await calendarStore.resetForNewUser()
  } catch (error) {
    console.error('Error during logout:', error)
  }
  router.push('/login')
  emit('close-sidebar')
}
</script>

<style scoped lang="scss">
.sidebar {
  width: 280px;
  min-width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, rgba(26, 26, 26, 0.98) 0%, rgba(13, 13, 13, 0.98) 100%);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(168, 85, 247, 0.2);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(168, 85, 247, 0.2);
  background: linear-gradient(180deg, rgba(168, 85, 247, 0.1) 0%, transparent 100%);
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile-icon {
  color: rgba(255, 255, 255, 0.9);
}

.profile-details {
  flex: 1;

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }

  p {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
  }
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.nav-section {
  margin-bottom: 1rem;
}

.nav-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(168, 85, 247, 0.08);
  }
}

.nav-section-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-section-toggle {
  color: rgba(255, 255, 255, 0.5);
  transition: transform 0.3s;

  &.rotated {
    transform: rotate(180deg);
  }
}

.nav-items {
  padding: 0.5rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.7);

  &:hover {
    background: rgba(168, 85, 247, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }

  &.active {
    background: rgba(168, 85, 247, 0.2);
    color: #a855f7;
    border-left: 3px solid #a855f7;
  }
}

.nav-icon {
  font-size: 1.25rem;
}

.nav-label {
  font-size: 0.95rem;
  font-weight: 500;
}

.profile-list {
  padding: 0.5rem 0;
}

.profile-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.7);

  &:hover {
    background: rgba(168, 85, 247, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }

  &.active-profile {
    background: rgba(168, 85, 247, 0.2);
    color: #a855f7;
    border-left: 3px solid #a855f7;
  }
}

.profile-item-icon {
  font-size: 1.25rem;
}

.profile-item-label {
  font-size: 0.95rem;
  font-weight: 500;
}

.no-profiles {
  padding: 1rem 1.5rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

.sidebar-footer {
  margin-top: auto;
  padding: 1rem 0;
  border-top: 1px solid rgba(168, 85, 247, 0.2);
}

.logout-item {
  color: #ef4444;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
  }
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    transform: translateX(-100%);

    &.sidebar-mobile-open {
      transform: translateX(0);
    }
  }
}
</style>
