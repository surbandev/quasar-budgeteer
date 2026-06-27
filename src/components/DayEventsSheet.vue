<template>
  <q-dialog v-model="isOpen" position="bottom" class="day-events-dialog">
    <q-card class="day-events-sheet">
      <q-card-section class="sheet-header">
        <div>
          <h3 class="sheet-title">{{ dateLabel }}</h3>
          <p class="sheet-subtitle">
            {{ events.length }} planned item{{ events.length === 1 ? '' : 's' }}
          </p>
        </div>
        <button type="button" class="sheet-close" aria-label="Close" @click="isOpen = false">
          <q-icon name="close" size="22px" />
        </button>
      </q-card-section>

      <q-card-section class="sheet-list">
        <button
          v-for="event in events"
          :key="event.id || event._id"
          type="button"
          class="sheet-event-row"
          @click="onEdit(event)"
        >
          <span
            class="sheet-event-icon"
            :class="{ 'has-brand-icon': hasBrandIcon(event.name, event.category) }"
            :style="
              hasBrandIcon(event.name, event.category)
                ? {}
                : { backgroundColor: getIconColor(event.name, event.category) }
            "
          >
            <BrandIcon
              :transaction-name="event.name"
              :category="event.category"
              size="20px"
              color="white"
            />
          </span>
          <span class="sheet-event-meta">
            <span class="sheet-event-name">{{ event.name || 'Unnamed' }}</span>
            <span class="sheet-event-sub">
              {{ formatCategory(event.category) }}
              <template v-if="event.description"> · {{ event.description }}</template>
            </span>
          </span>
          <span
            class="sheet-event-amount"
            :class="{
              negative: event.type === 'DEBIT',
              positive: event.type === 'CREDIT',
            }"
          >
            ${{ displayAmount(event).toFixed(2) }}
          </span>
          <q-icon name="chevron_right" size="20px" class="sheet-event-chevron" />
        </button>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useConstantsStore } from '../stores/constants'
import { getEventDisplayAmount } from '../js/scenarioSummary'
import BrandIcon from './BrandIcon.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  date: { type: Date, default: null },
  events: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'edit'])

const constantsStore = useConstantsStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const dateLabel = computed(() => {
  if (!props.date) return 'Planned items'
  const d = props.date instanceof Date ? props.date : new Date(props.date)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
})

function displayAmount(event) {
  return getEventDisplayAmount(event)
}

function formatCategory(category) {
  if (!category) return 'Uncategorized'
  return String(category).replace(/_/g, ' ')
}

function getIconColor(name, category) {
  return constantsStore.getBrandColor(name) || constantsStore.getCategoryColor(category)
}

function hasBrandIcon(name, category) {
  return constantsStore.hasBrandIcon(name, category)
}

function onEdit(event) {
  isOpen.value = false
  emit('edit', event)
}
</script>

<style scoped lang="scss">
.day-events-sheet {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: var(--buddy-surface) !important;
  border-radius: 20px 20px 0 0;
  border: 1px solid var(--buddy-hairline);
  border-bottom: none;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.sheet-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.25rem 0.75rem !important;
}

.sheet-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--buddy-text);
}

.sheet-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: var(--buddy-text-dim);
}

.sheet-close {
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: var(--buddy-text);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.sheet-list {
  padding: 0 0.75rem 1rem !important;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: min(60vh, 420px);
  overflow-y: auto;
}

.sheet-event-row {
  width: 100%;
  border: none;
  background: var(--buddy-surface-inset);
  border-radius: 14px;
  padding: 0.75rem 0.65rem 0.75rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  &:active {
    transform: scale(0.99);
  }
}

.sheet-event-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.has-brand-icon {
    background: transparent;
  }
}

.sheet-event-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.sheet-event-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--buddy-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sheet-event-sub {
  font-size: 0.78rem;
  color: var(--buddy-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sheet-event-amount {
  font-size: 0.95rem;
  font-weight: 700;
  flex-shrink: 0;

  &.negative {
    color: #fff;
  }

  &.positive {
    color: #4ade80;
  }
}

.sheet-event-chevron {
  color: var(--buddy-text-faint);
  flex-shrink: 0;
}
</style>
