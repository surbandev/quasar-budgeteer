<template>
  <Transition name="install-banner">
    <div v-if="visible" class="install-banner" role="region" aria-label="Install app">
      <div class="install-banner-body">
        <q-icon name="install_mobile" size="28px" class="install-banner-icon" />
        <div class="install-banner-text">
          <div class="install-banner-title">Install Budgeteer</div>
          <div class="install-banner-hint">{{ hintText }}</div>
        </div>
      </div>
      <div class="install-banner-actions">
        <q-btn
          v-if="canNativeInstall"
          unelevated
          no-caps
          color="primary"
          label="Install"
          class="install-banner-btn"
          @click="triggerNativeInstall"
        />
        <q-btn
          flat
          no-caps
          color="white"
          label="Not now"
          class="install-banner-dismiss"
          @click="dismiss"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  dismissInstallBanner,
  isAndroid,
  isIos,
  isMobileBrowser,
  isStandalonePwa,
  wasInstallBannerDismissed,
} from '../js/pwaInstall'

const visible = ref(false)
const deferredPrompt = ref(null)

const canNativeInstall = computed(() => Boolean(deferredPrompt.value))

const hintText = computed(() => {
  if (canNativeInstall.value) {
    return 'Add Budgeteer to your home screen for the full app experience.'
  }
  if (isIos()) {
    return 'Tap Share, then “Add to Home Screen”.'
  }
  if (isAndroid()) {
    return 'Open the browser menu and choose “Install app” or “Add to Home screen”.'
  }
  return 'Add Budgeteer to your home screen for the full app experience.'
})

function dismiss() {
  dismissInstallBanner()
  visible.value = false
}

async function triggerNativeInstall() {
  const prompt = deferredPrompt.value
  if (!prompt) return

  prompt.prompt()
  await prompt.userChoice
  deferredPrompt.value = null
  dismiss()
}

function onBeforeInstallPrompt(event) {
  event.preventDefault()
  deferredPrompt.value = event
  if (!isStandalonePwa() && !wasInstallBannerDismissed()) {
    visible.value = true
  }
}

function evaluateVisibility() {
  visible.value =
    isMobileBrowser() && !isStandalonePwa() && !wasInstallBannerDismissed()
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  evaluateVisibility()
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
})
</script>

<style scoped lang="scss">
.install-banner {
  position: fixed;
  left: 0.75rem;
  right: 0.75rem;
  bottom: calc(var(--app-vv-bottom, 0px) + env(safe-area-inset-bottom, 0px) + 5.5rem);
  z-index: 1999;
  max-width: 460px;
  margin: 0 auto;
  padding: 0.85rem 0.9rem;
  border-radius: 18px;
  background: rgba(26, 26, 26, 0.96);
  border: 1px solid rgba(168, 85, 247, 0.35);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
}

.install-banner-body {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.install-banner-icon {
  color: var(--buddy-accent, #a855f7);
  flex-shrink: 0;
}

.install-banner-title {
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
}

.install-banner-hint {
  margin-top: 0.2rem;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.82rem;
  line-height: 1.35;
}

.install-banner-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
  margin-top: 0.75rem;
}

.install-banner-btn {
  min-height: 34px;
  padding: 0 0.9rem;
}

.install-banner-dismiss {
  min-height: 34px;
  opacity: 0.85;
}

.install-banner-enter-active,
.install-banner-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.install-banner-enter-from,
.install-banner-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
