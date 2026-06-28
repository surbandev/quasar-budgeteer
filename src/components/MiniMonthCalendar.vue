<template>
  <div class="mini-month-calendar">
    <div class="mini-weekdays">
      <span v-for="label in weekdayLabels" :key="label">{{ label }}</span>
    </div>
    <div class="mini-days">
      <button
        v-for="day in calendarDays"
        :key="day.date.getTime()"
        type="button"
        class="mini-day"
        :class="{
          'other-month': !day.currentMonth,
          today: day.isToday,
          'has-events': day.hasEvents && day.currentMonth,
          selected: isSelected(day),
        }"
        :disabled="!day.currentMonth"
        @click="$emit('select', day)"
      >
        <span class="mini-day-num">{{ day.day }}</span>
        <div
          v-if="day.hasEvents && day.currentMonth && day.events?.length"
          class="mini-day-events"
        >
          <span
            v-for="event in visibleEvents(day.events)"
            :key="event.id || event._id"
            class="mini-day-event"
            :class="{ credit: event.type === 'CREDIT' }"
            :title="event.name"
          >
            {{ event.name || 'Unnamed' }}
          </span>
          <span v-if="hiddenEventCount(day.events)" class="mini-day-more">
            +{{ hiddenEventCount(day.events) }} more
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  calendarDays: {
    type: Array,
    required: true,
    default: () => [],
  },
  selectedDate: {
    type: Date,
    default: null,
  },
})

defineEmits(['select'])

const $q = useQuasar()
const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const maxVisibleEvents = computed(() => ($q.screen.gt.sm ? 2 : 1))

function visibleEvents(events) {
  return (events || []).slice(0, maxVisibleEvents.value)
}

function hiddenEventCount(events) {
  const count = events?.length || 0
  return count > maxVisibleEvents.value ? count - maxVisibleEvents.value : 0
}

function isSelected(day) {
  if (!props.selectedDate || !day.currentMonth) return false
  const sel = props.selectedDate
  const d = day.date instanceof Date ? day.date : new Date(day.date)
  return (
    d.getFullYear() === sel.getFullYear() &&
    d.getMonth() === sel.getMonth() &&
    d.getDate() === sel.getDate()
  )
}
</script>

<style scoped lang="scss">
.mini-month-calendar {
  width: 100%;
}

.mini-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 0.35rem;

  span {
    text-align: center;
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--buddy-text-faint);
    letter-spacing: 0.02em;
  }
}

.mini-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
}

.mini-day {
  aspect-ratio: auto;
  min-height: 58px;
  border: none;
  border-radius: 8px;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 2px;
  padding: 3px 2px;
  cursor: pointer;
  position: relative;

  &.other-month {
    opacity: 0.28;
    pointer-events: none;
  }

  &.has-events {
    background: rgba(168, 85, 247, 0.08);
    border: 1px solid rgba(168, 85, 247, 0.14);
  }

  &.today .mini-day-num {
    background: var(--buddy-accent);
    color: #fff;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &.selected:not(.today) .mini-day-num {
    background: rgba(168, 85, 247, 0.2);
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:active:not(.other-month) {
    transform: scale(0.97);
  }
}

.mini-day-num {
  align-self: flex-start;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--buddy-text);
  line-height: 1;
  margin-bottom: 1px;
}

.mini-day-events {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  min-width: 0;
  flex: 1;
}

.mini-day-event {
  font-size: 0.52rem;
  line-height: 1.2;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.82);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;

  &.credit {
    color: #4ade80;
  }
}

.mini-day-more {
  font-size: 0.48rem;
  line-height: 1.15;
  color: var(--buddy-text-faint);
  text-align: left;
}

@media (min-width: 768px) {
  .mini-weekdays span {
    font-size: 0.75rem;
  }

  .mini-days {
    gap: 4px;
  }

  .mini-day {
    min-height: 76px;
    padding: 5px 4px;

    &:hover:not(.other-month) {
      background: rgba(255, 255, 255, 0.06);
    }

    &.has-events:hover:not(.other-month) {
      background: rgba(168, 85, 247, 0.12);
    }

    &.today .mini-day-num {
      width: 24px;
      height: 24px;
      font-size: 0.75rem;
    }

    &.selected:not(.today) .mini-day-num {
      width: 24px;
      height: 24px;
    }
  }

  .mini-day-num {
    font-size: 0.74rem;
    margin-bottom: 3px;
  }

  .mini-day-event {
    font-size: 0.64rem;
    line-height: 1.25;
  }

  .mini-day-more {
    font-size: 0.58rem;
    line-height: 1.2;
  }
}

@media (min-width: 1024px) {
  .mini-day {
    min-height: 92px;
    padding: 6px 5px;
  }

  .mini-day-event {
    font-size: 0.72rem;
  }

  .mini-day-more {
    font-size: 0.64rem;
  }
}
</style>
