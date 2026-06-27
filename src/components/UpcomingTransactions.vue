<template>
  <q-card class="upcoming-card glass-card">
    <q-card-section class="upcoming-section">
      <div class="upcoming-header">
        <h3 class="upcoming-title">Upcoming</h3>
        <span v-if="displayedTransactions.length" class="upcoming-count">
          {{ displayedTransactions.length }}
        </span>
      </div>

      <div class="upcoming-transactions-list">
        <button
          v-for="transaction in displayedTransactions"
          :key="`${transaction.id || transaction._id}-${transaction.date}`"
          type="button"
          class="upcoming-row"
          @click="$emit('edit', transaction)"
        >
          <span
            class="upcoming-icon"
            :class="{ 'has-brand-icon': hasBrandIcon(transaction.name, transaction.category) }"
            :style="
              hasBrandIcon(transaction.name, transaction.category)
                ? {}
                : { backgroundColor: getIconColor(transaction.name, transaction.category) }
            "
          >
            <BrandIcon
              :transaction-name="transaction.name"
              :category="transaction.category"
              size="20px"
              color="white"
            />
          </span>
          <span class="upcoming-meta">
            <span class="upcoming-name">{{ transaction.name || 'Unnamed' }}</span>
            <span class="upcoming-sub">
              {{ formatTransactionDate(transaction.date) }}
              <template v-if="!showAllTransactions && transaction.daysRemaining >= 0">
                · {{ transaction.daysRemaining === 0 ? 'Today' : `In ${transaction.daysRemaining}d` }}
              </template>
            </span>
          </span>
          <span
            class="upcoming-amount"
            :class="{
              negative: transaction.type === 'DEBIT',
              positive: transaction.type === 'CREDIT',
            }"
          >
            ${{ (getEventDisplayAmount(transaction) || 0).toFixed(2) }}
          </span>
        </button>

        <div v-if="upcomingTransactions.length === 0" class="no-upcoming-transactions">
          <span>No upcoming planned items this month</span>
        </div>
      </div>

      <button
        v-if="upcomingTransactions.length > 0"
        type="button"
        class="see-all-btn"
        @click="toggleTransactionsView"
      >
        {{ showAllTransactions ? 'Show upcoming only' : 'See all this month' }}
      </button>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useConstantsStore } from '../stores/constants'
import BrandIcon from './BrandIcon.vue'

const props = defineProps({
  calendarDays: {
    type: Array,
    required: true,
    default: () => [],
  },
})

defineEmits(['edit'])

const constantsStore = useConstantsStore()
const showAllTransactions = ref(false)

const upcomingTransactions = computed(() => {
  if (!props.calendarDays || !Array.isArray(props.calendarDays)) {
    return []
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingEvents = []

  props.calendarDays.forEach((day) => {
    if (!day.currentMonth || !day.events?.length) return

    const dayDate = new Date(day.date)
    dayDate.setHours(0, 0, 0, 0)

    if (dayDate > today) {
      day.events.forEach((event) => {
        const daysRemaining = Math.ceil((dayDate - today) / (1000 * 60 * 60 * 24))
        upcomingEvents.push({
          ...event,
          date: toLocalDateString(dayDate),
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        })
      })
    }
  })

  return upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date))
})

const allTransactionsThisMonth = computed(() => {
  if (!props.calendarDays || !Array.isArray(props.calendarDays)) {
    return []
  }

  const currentMonthEvents = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  props.calendarDays.forEach((day) => {
    if (!day.currentMonth || !day.events?.length) return

    const dayDate = new Date(day.date)
    dayDate.setHours(0, 0, 0, 0)

    day.events.forEach((event) => {
      const daysRemaining = Math.ceil((dayDate - today) / (1000 * 60 * 60 * 24))
      currentMonthEvents.push({
        ...event,
        date: toLocalDateString(dayDate),
        daysRemaining,
      })
    })
  })

  return currentMonthEvents.sort((a, b) => new Date(a.date) - new Date(b.date))
})

const displayedTransactions = computed(() =>
  showAllTransactions.value ? allTransactionsThisMonth.value : upcomingTransactions.value,
)

function getEventDisplayAmount(event) {
  if (!event) return 0

  const loanCategories = ['MORTGAGE', 'GENERIC_LOAN', 'AUTO_LOAN']
  if (
    loanCategories.includes(event.category) &&
    event.monthly_payment &&
    event.monthly_payment > 0
  ) {
    if (event.category === 'MORTGAGE' && event.escrow && event.escrow > 0) {
      return parseFloat(event.monthly_payment) + parseFloat(event.escrow)
    }
    return parseFloat(event.monthly_payment)
  }

  const amount = event.amount
  if (amount !== undefined && amount !== null) {
    return parseFloat(amount) || 0
  }

  return 0
}

function getIconColor(transactionName, category) {
  const brandColor = constantsStore.getBrandColor(transactionName)
  return brandColor || constantsStore.getCategoryColor(category)
}

function hasBrandIcon(transactionName, category) {
  return constantsStore.hasBrandIcon(transactionName, category)
}

function toggleTransactionsView() {
  showAllTransactions.value = !showAllTransactions.value
}

function formatTransactionDate(dateString) {
  if (!dateString) return 'No date'
  let date
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number)
    date = new Date(year, month - 1, day)
  } else {
    date = new Date(dateString)
  }
  if (isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function toLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
</script>

<style scoped lang="scss">
.upcoming-card {
  margin-top: 0;
}

.upcoming-section {
  padding: 1rem 1rem 0.85rem !important;
}

.upcoming-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.upcoming-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--buddy-text);
  margin: 0;
}

.upcoming-count {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--buddy-text-dim);
  background: var(--buddy-surface-inset);
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
}

.upcoming-transactions-list {
  display: flex;
  flex-direction: column;
}

.upcoming-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0;
  border: none;
  border-bottom: 1px solid var(--buddy-hairline);
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:last-of-type {
    border-bottom: none;
  }

  &:active {
    opacity: 0.85;
  }
}

.upcoming-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upcoming-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.upcoming-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--buddy-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upcoming-sub {
  font-size: 0.78rem;
  color: var(--buddy-text-dim);
}

.upcoming-amount {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--buddy-text);
  flex-shrink: 0;

  &.positive {
    color: #4ade80;
  }
}

.no-upcoming-transactions {
  padding: 1.25rem 0;
  text-align: center;
  color: var(--buddy-text-dim);
  font-size: 0.88rem;
}

.see-all-btn {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.65rem;
  border: none;
  border-radius: 12px;
  background: var(--buddy-surface-inset);
  color: var(--buddy-accent);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;

  &:active {
    opacity: 0.85;
  }
}
</style>
