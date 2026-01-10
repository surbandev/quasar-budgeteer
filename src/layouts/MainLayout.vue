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
          <q-tab
            v-for="tab in tabs"
            :key="tab.name"
            :name="tab.name"
            :label="tab.label"
            no-caps
          />
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
          <q-tab
            v-for="tab in tabs"
            :key="tab.name"
            :name="tab.name"
            :label="tab.label"
            no-caps
          />
        </q-tabs>
      </div>
    </q-header>

    <!-- Desktop Sidebar -->
    <div v-if="$q.screen.gt.md" class="desktop-sidebar">
      <SidebarNavigation />
    </div>

    <!-- Mobile Sidebar Drawer -->
    <q-drawer
      v-model="leftDrawerOpen"
      :breakpoint="1024"
      :width="280"
      overlay
      behavior="mobile"
      class="mobile-drawer"
    >
      <SidebarNavigation
        :mobileSidebarOpen="leftDrawerOpen"
        @close-sidebar="leftDrawerOpen = false"
      />
    </q-drawer>

    <q-page-container
      :class="{
        'with-desktop-sidebar': $q.screen.gt.md,
        'with-mobile-header': $q.screen.lt.lg,
        'with-desktop-header': $q.screen.gt.md
      }"
    >
      <router-view />
    </q-page-container>

    <!-- Bottom Navigation (Mobile/Tablet only) -->
    <q-footer v-if="$q.screen.lt.lg" class="bottom-nav">
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
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter, useRoute } from 'vue-router'
import SidebarNavigation from 'components/SidebarNavigation.vue'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const leftDrawerOpen = ref(false)
const currentTab = ref('overview')
const bottomTab = ref('overview')

// Determine which tabs to show based on current route
const isCalendarRoute = computed(() => {
  // Show calendar tabs if on calendar page or transaction page with eventID (editing from calendar)
  return route.path.startsWith('/calendar') || (route.path === '/transaction' && route.query.eventID)
})

const tabs = computed(() => {
  if (isCalendarRoute.value) {
    return [
      { name: 'calendar', label: 'CALENDAR' },
      { name: 'scenarios', label: 'SCENARIOS' },
      { name: 'transaction', label: 'TRANSACTION' }
    ]
  }
  return [
    { name: 'overview', label: 'OVERVIEW' },
    { name: 'spending', label: 'SPENDING' },
    { name: 'list', label: 'LIST' }
  ]
})

function onTabChange(tabName) {
  // Dashboard tabs
  if (tabName === 'overview') {
    router.push('/dashboard')
  } else if (tabName === 'spending') {
    router.push('/spending')
  } else if (tabName === 'list') {
    router.push('/entries')
  }
  // Calendar tabs
  else if (tabName === 'calendar') {
    router.push('/calendar?view=calendar')
  } else if (tabName === 'scenarios') {
    router.push('/calendar?view=scenarios')
  } else if (tabName === 'transaction') {
    router.push('/calendar?view=transaction')
  }
}

function onBottomTabChange(tabName) {
  if (tabName === 'overview') {
    router.push('/dashboard')
  } else if (tabName === 'budget') {
    router.push('/calendar?view=calendar')
  } else if (tabName === 'tools') {
    router.push('/tools')
  }
}

// Watch route changes to update currentTab and bottomTab
watch(
  () => [route.path, route.query.view, route.query.eventID],
  ([newPath, viewQuery, eventID]) => {
    // Dashboard routes
    if (newPath === '/dashboard') {
      currentTab.value = 'overview'
      bottomTab.value = 'overview'
    } else if (newPath === '/spending') {
      currentTab.value = 'spending'
      bottomTab.value = 'overview'
    } else if (newPath === '/entries') {
      currentTab.value = 'list'
      bottomTab.value = 'overview'
    }
    // Calendar routes
    else if (newPath.startsWith('/calendar')) {
      if (viewQuery === 'scenarios') {
        currentTab.value = 'scenarios'
      } else if (viewQuery === 'transaction') {
        currentTab.value = 'transaction'
      } else {
        currentTab.value = 'calendar'
      }
      bottomTab.value = 'budget'
    }
    // Transaction route - if it has eventID, it's from calendar, show calendar tabs
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
    // Other routes (feedback, settings, etc.) - keep current bottom tab
    else {
      // Don't change bottomTab for other routes
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
    height: 4px;
    border-radius: 4px 4px 0 0;
    background: white;
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
  margin-left: 280px; // Account for sidebar width

  .header-content {
    padding: 0.75rem 2rem;
  }
}

.with-desktop-header {
  padding-top: 72px; // Space for fixed desktop header
}

// Desktop sidebar
.desktop-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 1000;
}

.with-desktop-sidebar {
  margin-left: 280px;
}

.with-mobile-header {
  padding-bottom: 70px; // Space for bottom nav
}

// Mobile drawer
.mobile-drawer {
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
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

@media (max-width: 1023px) {
  .with-desktop-sidebar {
    margin-left: 0;
  }
}

@media (min-width: 1024px) {
  .with-mobile-header {
    padding-bottom: 0;
  }
}
</style>
