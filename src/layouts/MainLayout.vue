<template>
  <q-layout view="hHh lpR lFf" class="main-layout">
    <!-- Mobile Header -->
    <q-header class="mobile-header" v-if="$q.screen.lt.md">
      <q-toolbar class="glass-toolbar">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
          color="white"
        />

        <q-toolbar-title class="text-bold text-white">
          <div class="flex items-center">
            <q-icon name="savings" class="q-mr-sm" />
            Moneyballs
          </div>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <!-- Desktop Sidebar -->
    <div v-if="$q.screen.gt.sm" class="desktop-sidebar">
      <SidebarNavigation />
    </div>

    <!-- Mobile Sidebar Drawer -->
    <q-drawer
      v-model="leftDrawerOpen"
      :breakpoint="768"
      :width="280"
      overlay
      behavior="mobile"
      class="mobile-drawer"
      v-if="$q.screen.lt.md"
    >
      <SidebarNavigation
        :mobileSidebarOpen="leftDrawerOpen"
        @close-sidebar="leftDrawerOpen = false"
      />
    </q-drawer>

    <!-- Backdrop for mobile sidebar -->
    <div
      v-if="leftDrawerOpen && $q.screen.lt.md"
      class="mobile-sidebar-backdrop"
      @click="leftDrawerOpen = false"
    />

    <q-page-container :class="{ 'with-desktop-sidebar': $q.screen.gt.sm }">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import SidebarNavigation from 'components/SidebarNavigation.vue'

const $q = useQuasar()
const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>

<style scoped lang="scss">
.main-layout {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  min-height: 100vh;
}

.mobile-header {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-toolbar {
  background: transparent;
}

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

.mobile-drawer {
  background: rgba(26, 26, 46, 0.98);
  backdrop-filter: blur(10px);
}

.mobile-sidebar-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

@media (max-width: 767px) {
  .with-desktop-sidebar {
    margin-left: 0;
  }
}
</style>
