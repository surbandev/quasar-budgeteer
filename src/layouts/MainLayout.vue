<template>
  <q-layout view="hHh lpR fFf" class="main-layout">
    <!-- Mobile/Tablet Header with Purple Gradient -->
    <q-header elevated class="app-header mobile-header" v-if="$q.screen.lt.lg">
      <div class="header-content">
        <!-- Tab Navigation -->
        <q-tabs
          v-model="currentTab"
          class="app-tabs"
          active-color="white"
          indicator-color="white"
          align="center"
          @update:model-value="onTabChange"
        >
          <q-tab v-for="tab in tabs" :key="tab.name" :name="tab.name" :label="tab.label" no-caps />
        </q-tabs>
      </div>
    </q-header>

    <!-- Desktop Header with Tabs -->
    <q-header elevated class="app-header desktop-header" v-if="$q.screen.gt.md">
      <div class="header-content">
        <!-- Tab Navigation -->
        <q-tabs
          v-model="currentTab"
          class="app-tabs desktop-tabs"
          active-color="white"
          indicator-color="white"
          align="center"
          @update:model-value="onTabChange"
        >
          <q-tab v-for="tab in tabs" :key="tab.name" :name="tab.name" :label="tab.label" no-caps />
        </q-tabs>
      </div>
    </q-header>

    <q-page-container
      :class="{
        'with-mobile-header': $q.screen.lt.lg,
        'with-desktop-header': $q.screen.gt.md,
      }"
    >
      <router-view />
    </q-page-container>

    <!-- Bottom Navigation -->
    <q-footer class="bottom-nav">
      <q-tabs
        v-model="bottomTab"
        class="bottom-tabs"
        active-color="primary"
        indicator-color="transparent"
        @update:model-value="onBottomTabChange"
      >
        <q-tab name="overview" icon="visibility" label="Overview" no-caps class="bottom-tab" />
        <q-tab name="budget" icon="sync" label="Budget" no-caps class="bottom-tab" />
        <q-tab name="tools" icon="work" label="Tools" no-caps class="bottom-tab" />
        <q-tab name="logout" icon="logout" label="Sign Out" no-caps class="bottom-tab" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter, useRoute } from 'vue-router'
import { useProfileStore } from '../stores/profile'
import { useCalendarStore } from '../stores/calendar'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const profileStore = useProfileStore()
const calendarStore = useCalendarStore()
const currentTab = ref('overview')
const bottomTab = ref('overview')

// Determine which tabs to show based on current route
const isCalendarRoute = computed(() => {
  // Show calendar tabs if on budget page or transaction page with eventID (editing from budget)
  return route.path.startsWith('/budget') || (route.path === '/transaction' && route.query.eventID)
})

const tabs = computed(() => {
  if (isCalendarRoute.value) {
    return [
      { name: 'calendar', label: 'CALENDAR' },
      { name: 'scenarios', label: 'SCENARIOS' },
      { name: 'transaction', label: 'TRANSACTION' },
    ]
  }
  return [
    { name: 'overview', label: 'OVERVIEW' },
    { name: 'spending', label: 'SPENDING' },
    { name: 'list', label: 'LIST' },
  ]
})

function onTabChange(tabName) {
  // Overview tabs
  if (tabName === 'overview') {
    router.push('/overview')
  } else if (tabName === 'spending') {
    router.push('/spending')
  } else if (tabName === 'list') {
    router.push('/entries')
  }
  // Budget tabs (calendar, scenarios, transaction)
  else if (tabName === 'calendar') {
    router.push('/budget?view=calendar')
  } else if (tabName === 'scenarios') {
    router.push('/budget?view=scenarios')
  } else if (tabName === 'transaction') {
    router.push('/budget?view=transaction')
  }
}

async function onBottomTabChange(tabName) {
  if (tabName === 'overview') {
    if (route.path !== '/overview') {
      router.push('/overview')
    }
  } else if (tabName === 'budget') {
    if (route.path !== '/budget' || route.query.view !== 'calendar') {
      router.push('/budget?view=calendar')
    }
  } else if (tabName === 'tools') {
    // Always navigate to /tools, even if already there
    // This allows re-clicking the tools tab after navigating away
    router.push('/tools')
  } else if (tabName === 'logout') {
    // Show confirmation dialog before logout
    $q.dialog({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of your session?',
      cancel: true,
      persistent: true,
      color: 'primary',
    })
      .onOk(async () => {
        // User confirmed logout
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
      })
      .onCancel(() => {
        // User cancelled - reset bottomTab to previous value
        // Determine the correct tab based on current route
        if (route.path === '/overview') {
          bottomTab.value = 'overview'
        } else if (route.path.startsWith('/budget')) {
          bottomTab.value = 'budget'
        } else if (route.path === '/tools') {
          bottomTab.value = 'tools'
        } else {
          bottomTab.value = 'overview'
        }
      })
  }
}

// Watch route changes to update currentTab and bottomTab
watch(
  () => [route.path, route.query.view, route.query.eventID],
  ([newPath, viewQuery, eventID]) => {
    // Overview routes
    if (newPath === '/overview') {
      currentTab.value = 'overview'
      bottomTab.value = 'overview'
    } else if (newPath === '/spending') {
      currentTab.value = 'spending'
      bottomTab.value = 'overview'
    } else if (newPath === '/entries') {
      currentTab.value = 'list'
      bottomTab.value = 'overview'
    }
    // Budget routes
    else if (newPath.startsWith('/budget')) {
      if (viewQuery === 'scenarios') {
        currentTab.value = 'scenarios'
      } else if (viewQuery === 'transaction') {
        currentTab.value = 'transaction'
      } else {
        currentTab.value = 'calendar'
      }
      bottomTab.value = 'budget'
    }
    // Transaction route - if it has eventID, it's from budget, show budget tabs
    else if (newPath === '/transaction' && eventID) {
      currentTab.value = 'transaction'
      bottomTab.value = 'budget'
    }
    // Transaction route without eventID - new transaction, show dashboard tabs
    else if (newPath === '/transaction' && !eventID) {
      currentTab.value = 'overview'
      bottomTab.value = 'overview'
    }
    // Tools route
    else if (newPath === '/tools') {
      bottomTab.value = 'tools'
    }
    // Other routes (feedback, settings, etc.) - reset to overview so tools tab can be clicked again
    else {
      // Reset bottomTab for other routes so tools tab can be clicked again when returning
      // Only reset if currently on tools to avoid unnecessary changes
      if (bottomTab.value === 'tools') {
        bottomTab.value = 'overview'
      }
    }
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.main-layout {
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
  min-height: 100vh;
}

// Header with purple gradient (like the screenshot)
.app-header {
  background: linear-gradient(180deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
}

.header-content {
  padding-bottom: 0;
}

.top-toolbar {
  padding: 0.75rem 1.5rem;
  min-height: 64px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

// Tab navigation styling
.app-tabs {
  background: transparent;

  :deep(.q-tab) {
    color: rgba(255, 255, 255, 0.6);
    font-weight: 600;
    letter-spacing: 0.5px;
    padding: 0.875rem 1.25rem;
    min-height: 52px;
    font-size: 0.875rem;
    text-transform: uppercase;
    transition: all 0.3s ease;
    border-radius: 0;

    &.q-tab--active {
      color: white;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.15);
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
    }

    &:hover:not(.q-tab--active) {
      color: rgba(255, 255, 255, 0.85);
      background: rgba(255, 255, 255, 0.08);
    }
  }

  :deep(.q-tabs__arrow) {
    color: white;
  }

  :deep(.q-tab__indicator) {
    display: none;
  }
}

// Mobile tab adjustments
@media (max-width: 600px) {
  .app-tabs {
    :deep(.q-tab) {
      padding: 0.75rem 0.875rem;
      font-size: 0.8rem;
      letter-spacing: 0.3px;
      min-height: 48px;
    }
  }
}

// Desktop header styling
.desktop-header {
  .header-content {
    padding: 0.75rem 2rem;
  }

  // Make tabs spread equally on desktop
  .desktop-tabs {
    :deep(.q-tabs__content) {
      display: flex;
      width: 100%;
    }

    :deep(.q-tab) {
      flex: 1;
      max-width: none;
      justify-content: center;
    }
  }
}

.with-desktop-header {
  padding-top: 72px; // Space for fixed desktop header
  padding-bottom: 80px; // Space for bottom nav
}

.with-mobile-header {
  padding-bottom: 70px; // Space for bottom nav
}

// Bottom navigation
.bottom-nav {
  background: rgba(30, 30, 30, 0.98);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
}

.bottom-tabs {
  :deep(.q-tab) {
    color: rgba(255, 255, 255, 0.6);
    min-height: 64px;
    padding: 0.5rem;

    &.q-tab--active {
      color: #a855f7;
    }

    .q-tab__icon {
      font-size: 24px;
      margin-bottom: 4px;
    }

    .q-tab__label {
      font-size: 0.75rem;
      font-weight: 500;
    }
  }
}

@media (min-width: 1024px) {
  .with-mobile-header {
    padding-bottom: 0;
  }

  // Bottom nav styling for desktop
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
  }

  .bottom-tabs {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 3rem;
    gap: 1.5rem;

    :deep(.q-tab) {
      flex: 1;
      max-width: 150px;
    }
  }
}
</style>
