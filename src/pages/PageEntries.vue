<template>
  <q-page class="entries-page">
    <div class="entries-container">
      <!-- Loading State -->
      <q-inner-loading :showing="loading" />

      <!-- Month Selector -->
      <div class="month-selector-card">
        <q-btn
          flat
          round
          icon="chevron_left"
          color="white"
          size="md"
          @click="previousMonth"
          class="month-nav-btn"
        />
        <div class="month-info">
          <div class="month-label">{{ selectedMonthLabel }}</div>
          <div class="transaction-count">{{ transactionCount }} TRANSACTIONS</div>
        </div>
        <q-btn
          flat
          round
          icon="chevron_right"
          color="white"
          size="md"
          @click="nextMonth"
          class="month-nav-btn"
        />
      </div>

      <!-- Summary Card -->
      <div class="summary-card glass-card">
        <div class="summary-item">
          <div class="summary-amount">{{ formatCurrency(monthlyIncome) }}</div>
          <div class="summary-label">INCOME</div>
        </div>
        <div class="summary-item">
          <div class="summary-amount">{{ formatCurrency(monthlyExpenses) }}</div>
          <div class="summary-label">EXPENSES</div>
        </div>
        <div class="summary-item">
          <div class="summary-amount" :class="monthlyBalance >= 0 ? 'positive' : 'negative'">
            {{ formatCurrency(monthlyBalance) }}
          </div>
          <div class="summary-label">BALANCE</div>
        </div>
      </div>

      <!-- Transactions by Day -->
      <div class="transactions-by-day">
        <div v-for="(dayGroup, index) in transactionsByDay" :key="index" class="day-group">
          <!-- Day Header -->
          <div class="day-header">
            <span class="day-date">{{ dayGroup.dayLabel }}</span>
            <span class="day-total">{{ formatCurrency(dayGroup.total) }}</span>
          </div>

          <!-- Transactions for this day -->
          <div class="day-transactions">
            <div
              v-for="transaction in dayGroup.transactions"
              :key="transaction.id || transaction._id"
              class="transaction-item"
              @click="viewTransaction(transaction)"
            >
              <div
                class="transaction-icon"
                :style="{ backgroundColor: constantsStore.getCategoryColor(transaction.category) }"
              >
                <q-icon
                  :name="constantsStore.getCategoryIcon(transaction.category)"
                  size="20px"
                  color="white"
                />
              </div>
              <div class="transaction-info">
                <span class="transaction-name">{{
                  transaction.name || 'Unnamed Transaction'
                }}</span>
                <span class="transaction-category">{{ toTitleCase(transaction.category) }}</span>
              </div>
              <div class="transaction-amount">
                {{ formatCurrency(getEventDisplayAmount(transaction)) }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="transactionsByDay.length === 0" class="no-data">
          <span>No transactions found for this month</span>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEventsStore } from '../stores/events'
import { useConstantsStore } from '../stores/constants'

const eventsStore = useEventsStore()
const constantsStore = useConstantsStore()

const loading = ref(false)
const selectedMonth = ref(new Date().getMonth()) // 0-11
const selectedYear = ref(new Date().getFullYear())

const filteredEvents = computed(() => eventsStore.filteredEvents || [])

const selectedMonthLabel = computed(() => {
  const date = new Date(selectedYear.value, selectedMonth.value, 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const transactionCount = computed(() => {
  if (!filteredEvents.value || !Array.isArray(filteredEvents.value)) {
    return 0
  }
  return filteredEvents.value.length
})

const monthlyIncome = computed(() => {
  if (!filteredEvents.value || !Array.isArray(filteredEvents.value)) {
    return 0
  }
  return filteredEvents.value
    .filter((event) => event.type === 'CREDIT')
    .reduce((sum, event) => sum + parseFloat(getEventDisplayAmount(event) || 0), 0)
})

const monthlyExpenses = computed(() => {
  if (!filteredEvents.value || !Array.isArray(filteredEvents.value)) {
    return 0
  }
  return filteredEvents.value
    .filter((event) => event.type === 'DEBIT')
    .reduce((sum, event) => sum + parseFloat(getEventDisplayAmount(event) || 0), 0)
})

const monthlyBalance = computed(() => monthlyIncome.value - monthlyExpenses.value)

const transactionsByDay = computed(() => {
  if (!filteredEvents.value || !Array.isArray(filteredEvents.value)) {
    return []
  }

  // Group transactions by day
  const grouped = {}

  filteredEvents.value.forEach((transaction) => {
    const date = new Date(transaction.date)
    const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD

    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        date: date,
        dateKey: dateKey,
        transactions: [],
        total: 0,
      }
    }

    grouped[dateKey].transactions.push(transaction)
    const amount = getEventDisplayAmount(transaction)
    grouped[dateKey].total += transaction.type === 'DEBIT' ? -amount : amount
  })

  // Convert to array and sort by date (newest first)
  const sortedGroups = Object.values(grouped).sort((a, b) => b.date - a.date)

  // Add formatted day labels
  return sortedGroups.map((group) => ({
    ...group,
    dayLabel: formatDayLabel(group.date),
  }))
})

function formatDayLabel(date) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const dateStr = date.toDateString()
  const todayStr = today.toDateString()
  const yesterdayStr = yesterday.toDateString()

  if (dateStr === todayStr) {
    return 'Today'
  } else if (dateStr === yesterdayStr) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function getEventDisplayAmount(event) {
  // Check for loan categories first - use monthly_payment instead of total loan amount
  const loanCategories = ['MORTGAGE', 'GENERIC_LOAN', 'AUTO_LOAN']
  if (loanCategories.includes(event.category)) {
    if (event.monthly_payment && event.monthly_payment > 0) {
      if (event.category === 'MORTGAGE' && event.escrow && event.escrow > 0) {
        return parseFloat(event.monthly_payment) + parseFloat(event.escrow)
      }
      return parseFloat(event.monthly_payment)
    }
  }

  // For non-loan categories or loans without monthly_payment, use the regular amount
  return event.amount || 0
}

function toTitleCase(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function viewTransaction(transaction) {
  // Future: Navigate to transaction detail view
  console.log('View transaction:', transaction)
}

async function previousMonth() {
  if (selectedMonth.value === 0) {
    selectedMonth.value = 11
    selectedYear.value -= 1
  } else {
    selectedMonth.value -= 1
  }

  // Update store and fetch data for new month
  const newDate = new Date(selectedYear.value, selectedMonth.value, 1)
  eventsStore.setCurrentDate(newDate)
  await eventsStore.fetchEventsForMonthByScenario()
}

async function nextMonth() {
  if (selectedMonth.value === 11) {
    selectedMonth.value = 0
    selectedYear.value += 1
  } else {
    selectedMonth.value += 1
  }

  // Update store and fetch data for new month
  const newDate = new Date(selectedYear.value, selectedMonth.value, 1)
  eventsStore.setCurrentDate(newDate)
  await eventsStore.fetchEventsForMonthByScenario()
}

onMounted(async () => {
  loading.value = true
  // Set the current date in the store to match our selected month/year
  const currentMonthDate = new Date(selectedYear.value, selectedMonth.value, 1)
  eventsStore.setCurrentDate(currentMonthDate)
  // Fetch events for the current month
  await eventsStore.fetchEventsForMonthByScenario()
  loading.value = false
})
</script>

<style scoped lang="scss">
.entries-page {
  padding: 1rem;
  min-height: 100vh;
  background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  position: relative;
  padding-bottom: 2rem;
}

.entries-container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.month-selector-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.25rem;
  background: var(--bg-button);
  backdrop-filter: blur(10px);
  border: 2px solid var(--border-secondary);
  border-radius: 24px;
  margin-bottom: 1.5rem;

  .month-nav-btn {
    opacity: 0.8;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 1;
    }
  }

  .month-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    flex: 1;

    .month-label {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      letter-spacing: -0.3px;
    }

    .transaction-count {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-tertiary);
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
  }
}

.summary-card {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 1.5rem;
  background: var(--bg-button);
  backdrop-filter: blur(10px);
  border: 2px solid var(--border-secondary);
  border-radius: 24px;
  margin-bottom: 1.5rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.summary-amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);

  &.positive {
    color: var(--color-positive);
  }

  &.negative {
    color: var(--color-negative-alt);
  }
}

.summary-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-tertiary);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.transactions-by-day {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.day-group {
  display: flex;
  flex-direction: column;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  margin-bottom: 0.5rem;
}

.day-date {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.day-total {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.day-transactions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--bg-button);
  border: 2px solid var(--border-secondary);
  border-radius: 16px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: var(--bg-button-hover);
    border-color: var(--border-primary);
    transform: translateX(4px);
  }
}

.transaction-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.transaction-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.transaction-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
}

.transaction-category {
  font-size: 0.85rem;
  color: var(--text-tertiary);
}

.transaction-amount {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.no-data {
  padding: 3rem 1.5rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 1rem;
}

// Tablet and desktop optimizations
@media (min-width: 1024px) {
  .entries-page {
    padding: clamp(1.5rem, 2vw, 2.5rem);
  }

  // Make container wider on desktop with fluid scaling
  .entries-container {
    max-width: min(90vw, 1600px);
    width: 100%;
  }

  // Make content boxes wider to fill space better with fluid padding
  .glass-card {
    :deep(.q-card__section) {
      padding: clamp(1.5rem, 2.5vw, 2.5rem) clamp(2rem, 3vw, 3rem);
    }
  }

  .month-selector-card {
    padding: clamp(1.5rem, 2vw, 2rem) clamp(1.25rem, 2.5vw, 2rem);
    margin-bottom: clamp(1.5rem, 2vw, 2.5rem);
  }

  .summary-card {
    padding: clamp(1.5rem, 2.5vw, 2.5rem) clamp(2rem, 3vw, 3rem);
  }

  .day-header {
    padding: clamp(1rem, 1.5vw, 1.5rem) clamp(1.25rem, 2vw, 2rem);
  }

  .transaction-item {
    padding: clamp(1rem, 1.5vw, 1.25rem) clamp(1.25rem, 2vw, 2rem);
  }
}

// Large desktop screens (1440px+)
@media (min-width: 1440px) {
  .entries-container {
    max-width: min(92vw, 1800px);
  }

  .glass-card {
    :deep(.q-card__section) {
      padding: clamp(1.75rem, 2.5vw, 3rem) clamp(2.5rem, 3.5vw, 4rem);
    }
  }

  .month-selector-card {
    padding: clamp(1.75rem, 2vw, 2.5rem) clamp(1.5rem, 2.5vw, 2.5rem);
  }

  .summary-card {
    padding: clamp(1.75rem, 2.5vw, 3rem) clamp(2.5rem, 3.5vw, 4rem);
  }
}

// Extra large screens (1920px+)
@media (min-width: 1920px) {
  .entries-container {
    max-width: min(94vw, 2000px);
  }

  .glass-card {
    :deep(.q-card__section) {
      padding: clamp(2rem, 2.5vw, 3.5rem) clamp(3rem, 4vw, 5rem);
    }
  }

  .month-selector-card {
    padding: clamp(2rem, 2vw, 3rem) clamp(2rem, 3vw, 3rem);
  }

  .summary-card {
    padding: clamp(2rem, 2.5vw, 3.5rem) clamp(3rem, 4vw, 5rem);
  }
}

@media (max-width: 768px) {
  .summary-amount {
    font-size: 1.25rem;
  }

  .summary-label {
    font-size: 0.65rem;
  }

  .transaction-icon {
    width: 40px;
    height: 40px;
  }

  .transaction-name {
    font-size: 0.95rem;
  }

  .transaction-category {
    font-size: 0.8rem;
  }
}
</style>
