<template>
  <q-layout view="hHh lpR fFf" class="main-layout">
    <!-- Mobile/Tablet Header with Purple Gradient -->
    <q-header elevated class="app-header" v-if="$q.screen.lt.lg">
      <div class="header-content">
        <!-- Top Bar -->
        <q-toolbar class="top-toolbar">
          <q-btn
            flat
            dense
            round
            icon="settings"
            aria-label="Settings"
            @click="toggleLeftDrawer"
            color="white"
            size="md"
          />

          <q-space />
        </q-toolbar>

        <!-- Tab Navigation -->
        <q-tabs
          v-model="currentTab"
          class="app-tabs"
          active-color="white"
          indicator-color="white"
          align="center"
          @update:model-value="onTabChange"
        >
          <q-tab name="overview" label="OVERVIEW" no-caps />
          <q-tab name="spending" label="SPENDING" no-caps />
          <q-tab name="list" label="LIST" no-caps />
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
      :class="{ 'with-desktop-sidebar': $q.screen.gt.md, 'with-mobile-header': $q.screen.lt.lg }"
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
      >
        <q-tab name="overview" icon="visibility" label="Overview" no-caps class="bottom-tab" />
        <q-tab name="budget" icon="sync" label="Budget" no-caps class="bottom-tab" />
        <q-tab name="save" icon="favorite" label="Save" no-caps class="bottom-tab" />
        <q-tab name="tools" icon="work" label="Tools" no-caps class="bottom-tab" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter, useRoute } from 'vue-router'
import SidebarNavigation from 'components/SidebarNavigation.vue'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const leftDrawerOpen = ref(false)
const currentTab = ref('overview')
const bottomTab = ref('overview')

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function onTabChange(tabName) {
  if (tabName === 'overview') {
    router.push('/dashboard')
  } else if (tabName === 'spending') {
    router.push('/spending')
  } else if (tabName === 'list') {
    router.push('/entries')
  }
}

// Watch route changes to update currentTab
watch(
  () => route.path,
  (newPath) => {
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
  background: linear-gradient(180deg, #a855f7 0%, #9333ea 50%, #7e22ce 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.header-content {
  padding-bottom: 0;
}

.top-toolbar {
  padding: 0.5rem 1rem;
  min-height: 60px;
}

// Tab navigation styling
.app-tabs {
  background: transparent;

  :deep(.q-tab) {
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
    letter-spacing: 0.5px;
    padding: 0.75rem 1.5rem;
    min-height: 48px;

    &.q-tab--active {
      color: white;
      font-weight: 600;
    }
  }

  :deep(.q-tabs__arrow) {
    color: white;
  }

  :deep(.q-tab__indicator) {
    height: 3px;
    border-radius: 3px 3px 0 0;
  }
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
