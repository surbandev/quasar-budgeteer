<template>
  <header class="app-header" :class="[`variant-${variant}`, { 'overlap-content': overlapContent }]">
    <div class="app-header-top">
      <button class="header-circle-btn" aria-label="Settings" @click="onGear">
        <q-icon name="settings" size="20px" />
      </button>

      <button
        class="header-title"
        :class="{ 'is-button': titleDropdown }"
        type="button"
        @click="onTitle"
      >
        <span v-if="label" class="header-label">{{ label }}:</span>
        <span class="header-title-text">{{ title }}</span>
        <q-icon v-if="titleDropdown" name="expand_more" size="20px" class="header-title-caret" />
      </button>

      <button
        v-if="rightIcon"
        class="header-circle-btn"
        :aria-label="rightLabel"
        @click="onRight"
      >
        <q-icon :name="rightIcon" size="20px" />
      </button>
      <span v-else class="header-circle-spacer" />
    </div>

    <nav v-if="tabs.length" class="header-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="header-tab"
        :class="{ active: tab.value === activeTab }"
        @click="onTab(tab)"
      >
        {{ tab.label }}
      </button>
    </nav>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  // Small word before the title, e.g. "Overview" / "Budget".
  label: { type: String, default: '' },
  // The main title, e.g. the active budget/profile name.
  title: { type: String, default: '' },
  // Drives the gradient color: 'overview' (purple), 'budget' (green), 'neutral'.
  variant: { type: String, default: 'overview' },
  // Pill sub-tabs: [{ label, value, to? }]. If `to` is set we navigate, else emit.
  tabs: { type: Array, default: () => [] },
  activeTab: { type: String, default: '' },
  titleDropdown: { type: Boolean, default: false },
  // Optional gear destination; if absent we emit 'gear'.
  gearTo: { type: [String, Object], default: '' },
  // Optional right-side action icon (e.g. 'add', 'search', 'edit').
  rightIcon: { type: String, default: '' },
  // Accessible label for the right action button.
  rightLabel: { type: String, default: '' },
  // When true, extra purple/green extends below tabs so the first card can overlap it.
  overlapContent: { type: Boolean, default: false },
})

const emit = defineEmits(['gear', 'title', 'right', 'tab'])
const router = useRouter()

function onGear() {
  if (props.gearTo) {
    router.push(props.gearTo)
  } else {
    emit('gear')
  }
}

function onTitle() {
  if (props.titleDropdown) emit('title')
}

function onRight() {
  emit('right')
}

function onTab(tab) {
  if (tab.value === props.activeTab) return
  if (tab.to) {
    router.push(tab.to)
  } else {
    emit('tab', tab.value)
  }
}
</script>

<style scoped lang="scss">
.app-header {
  padding: calc(env(safe-area-inset-top, 0px) + 0.75rem) 1rem 1.1rem;
  border-bottom-left-radius: 26px;
  border-bottom-right-radius: 26px;
  position: relative;
  z-index: 2;

  &.variant-overview {
    background: var(--buddy-header-overview);
  }
  &.variant-budget {
    background: var(--buddy-header-budget);
  }
  &.variant-neutral {
    background: var(--buddy-header-neutral);
  }

  // Buddy-style: gradient continues below tabs; first content card pulls up over it.
  &.overlap-content {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    padding-bottom: var(--buddy-header-overlap-pad);
  }
}

.app-header-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.header-circle-btn {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.18);
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.3);
  }
}

.header-circle-spacer {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
}

.header-title {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.05rem;
  padding: 0;

  &.is-button {
    cursor: pointer;
  }
}

.header-label {
  opacity: 0.8;
  font-weight: 500;
  white-space: nowrap;
}

.header-title-text {
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-title-caret {
  opacity: 0.9;
  flex-shrink: 0;
}

.header-tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.9rem;
  position: relative;
  z-index: 1;
}

.header-tab {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #fff;
  }

  &.active {
    color: #fff;
    background: rgba(255, 255, 255, 0.18);
  }
}
</style>
