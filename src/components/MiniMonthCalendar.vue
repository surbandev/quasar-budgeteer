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
        <span v-if="day.hasEvents && day.currentMonth" class="mini-day-dot" />
      </button>
    </div>
  </div>
</template>

<script setup>
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

const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

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
  gap: 2px;
}

.mini-day {
  aspect-ratio: 1;
  max-height: 44px;
  border: none;
  border-radius: 10px;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 0;
  cursor: pointer;
  position: relative;

  &.other-month {
    opacity: 0.28;
    pointer-events: none;
  }

  &.today .mini-day-num {
    background: var(--buddy-accent);
    color: #fff;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &.selected:not(.today) .mini-day-num {
    background: rgba(168, 85, 247, 0.2);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:active:not(.other-month) {
    transform: scale(0.94);
  }
}

.mini-day-num {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--buddy-text);
  line-height: 1;
}

.mini-day-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--buddy-accent);
  flex-shrink: 0;
}
</style>
