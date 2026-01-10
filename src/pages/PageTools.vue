<template>
  <q-page class="tools-page">
    <div class="tools-container">
      <h2 class="tools-title">Tools</h2>

      <div class="tools-content-card glass-card">
        <div class="tools-list">
          <q-btn
            flat
            no-caps
            class="tool-item"
            @click="goToFeedback"
          >
            <q-icon name="chat_bubble" size="md" />
            <span class="tool-label">Feedback</span>
            <q-icon name="chevron_right" class="tool-arrow" />
          </q-btn>

          <q-btn
            flat
            no-caps
            class="tool-item"
            @click="goToProfileSettings"
          >
            <q-icon name="person" size="md" />
            <span class="tool-label">Profile Settings</span>
            <q-icon name="chevron_right" class="tool-arrow" />
          </q-btn>

          <q-btn
            flat
            no-caps
            class="tool-item"
            @click="goToUserSettings"
          >
            <q-icon name="settings" size="md" />
            <span class="tool-label">User Settings</span>
            <q-icon name="chevron_right" class="tool-arrow" />
          </q-btn>

          <q-btn
            flat
            no-caps
            class="tool-item logout-item"
            @click="handleLogout"
          >
            <q-icon name="logout" size="md" />
            <span class="tool-label">Sign Out</span>
            <q-icon name="chevron_right" class="tool-arrow" />
          </q-btn>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useProfileStore } from '../stores/profile'
import { useCalendarStore } from '../stores/calendar'

const router = useRouter()
const profileStore = useProfileStore()
const calendarStore = useCalendarStore()

function goToFeedback() {
  router.push('/feedback')
}

function goToProfileSettings() {
  router.push('/profile-settings')
}

function goToUserSettings() {
  router.push('/user-settings')
}

async function handleLogout() {
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('userID')
    await profileStore.resetCurrentProfile()
    await calendarStore.resetForNewUser()
    router.push('/login')
  } catch (error) {
    console.error('Error during logout:', error)
    router.push('/login')
  }
}
</script>

<style scoped lang="scss">
.tools-page {
  padding: 1rem;
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
}

.tools-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 1rem;
}

.tools-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 1.5rem 0 2rem 0;
  text-align: center;
  letter-spacing: -0.5px;
}

.tools-content-card {
  padding: 2rem;
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(168, 85, 247, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.tools-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tool-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 12px;
  color: white;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    background: rgba(168, 85, 247, 0.15);
    border-color: rgba(168, 85, 247, 0.4);
    transform: translateX(4px);
  }

  .q-icon {
    color: rgba(255, 255, 255, 0.8);
  }

  &.logout-item {
    margin-top: 1rem;
    border-color: rgba(168, 85, 247, 0.4);
    background: rgba(168, 85, 247, 0.1);
    box-shadow: 0 0 10px rgba(168, 85, 247, 0.2);

    &:hover {
      background: rgba(168, 85, 247, 0.2);
      border-color: rgba(168, 85, 247, 0.6);
      box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
    }

    .q-icon {
      color: #a855f7;
    }

    .tool-label {
      color: #a855f7;
    }
  }
}

.tool-label {
  flex: 1;
  text-align: left;
  margin-left: 1rem;
  font-size: 1rem;
  font-weight: 500;
  color: white;
}

.tool-arrow {
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.25rem;
}

@media (max-width: 768px) {
  .tools-container {
    padding: 0.5rem;
  }

  .tools-title {
    font-size: 2rem;
    margin: 1rem 0 1.5rem 0;
  }

  .tools-content-card {
    padding: 1.5rem;
  }

  .tool-item {
    padding: 1rem 1.25rem;
  }

  .tool-label {
    font-size: 0.95rem;
  }
}
</style>
