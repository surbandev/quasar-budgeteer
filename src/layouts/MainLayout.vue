<template>
  <q-layout view="hHh lpR fFf" class="main-layout">
    <q-page-container>
      <router-view />
    </q-page-container>

    <InstallAppBanner />

    <!-- Bottom Navigation (Buddy-style floating pill) -->
    <q-footer class="bottom-nav">
      <nav class="buddy-nav" role="tablist">
        <button
          v-for="item in navItems"
          :key="item.id"
          type="button"
          class="buddy-nav-item"
          :class="{ active: activeNav === item.id }"
          :aria-selected="activeNav === item.id"
          @click="goToNav(item.id)"
        >
          <q-icon :name="item.icon" size="22px" class="buddy-nav-icon" />
          <span class="buddy-nav-label">{{ item.label }}</span>
        </button>
      </nav>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Notify } from 'quasar'
import InstallAppBanner from '../components/InstallAppBanner.vue'

const router = useRouter()
const route = useRoute()

// Buddy bottom nav: three sections. "Overview" (home/spending/list),
// "Budget" (plan/remaining/insights + scenarios), and "Tools" (the more hub).
const navItems = [
  { id: 'overview', label: 'Overview', icon: 'visibility' },
  { id: 'budget', label: 'Budget', icon: 'donut_large' },
  { id: 'tools', label: 'Tools', icon: 'work' },
]

// Pages that live under each bottom-nav section so the right item stays lit.
const overviewPaths = ['/overview', '/spending', '/entries']
const budgetPaths = ['/budget', '/create-scenario', '/delete-scenario', '/compare']
const toolsPaths = [
  '/tools',
  '/admin-settings',
  '/user-settings',
  '/profile-settings',
  '/feedback',
  '/weave',
]

const activeNav = computed(() => {
  const path = route.path
  if (overviewPaths.includes(path)) return 'overview'
  if (budgetPaths.includes(path)) return 'budget'
  if (toolsPaths.includes(path)) return 'tools'
  return ''
})

function goToNav(id) {
  if (id === 'overview') {
    if (route.path !== '/overview') router.push('/overview')
  } else if (id === 'budget') {
    router.push({ path: '/budget', query: { view: 'scenarios' } })
  } else if (id === 'tools') {
    if (route.path !== '/tools') router.push('/tools')
  }
}

function onPwaUpdated() {
  Notify.create({
    message: 'A new version is available.',
    color: 'primary',
    timeout: 0,
    actions: [
      {
        label: 'Refresh',
        color: 'white',
        handler: () => {
          window.location.reload()
        },
      },
    ],
  })
}

onMounted(() => {
  window.addEventListener('budgeteer-pwa-updated', onPwaUpdated)
})

onUnmounted(() => {
  window.removeEventListener('budgeteer-pwa-updated', onPwaUpdated)
})
</script>

<style scoped lang="scss">
.main-layout {
  background: var(--page-bg);
  min-height: 100vh;
}

// Header gradient (themeable via --header-gradient)
.app-header {
  background: var(--header-gradient);
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

// Bottom navigation — always fixed like Buddy; content scrolls underneath.
.bottom-nav {
  position: fixed !important;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  background: transparent;
  box-shadow: none;
  border: none;
  padding: 0 0.9rem calc(env(safe-area-inset-bottom, 0px) + 0.7rem);
  display: flex;
  justify-content: center;
  pointer-events: none;

  .buddy-nav {
    pointer-events: auto;
  }
}

// Reserve space so page content is not hidden behind the fixed pill.
.main-layout :deep(.q-page-container) {
  padding-bottom: var(--buddy-scroll-padding-bottom);
  background: var(--page-bg-solid);
}

.buddy-nav {
  width: 100%;
  max-width: 460px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: var(--buddy-surface);
  border: 1px solid var(--buddy-hairline);
  border-radius: 999px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
}

.buddy-nav-item {
  flex: 1;
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 0.45rem 0.5rem;
  border-radius: 999px;
  color: var(--buddy-text-dim);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;

  .buddy-nav-icon {
    transition: color 0.2s ease, transform 0.2s ease;
  }

  .buddy-nav-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  &:hover {
    color: rgba(255, 255, 255, 0.85);
  }

  &.active {
    color: var(--buddy-accent);
    background: rgba(168, 85, 247, 0.12);

    .buddy-nav-icon {
      color: var(--buddy-accent);
    }
  }
}

</style>
