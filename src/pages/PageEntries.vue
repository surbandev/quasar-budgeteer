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
                :style="{ backgroundColor: getCategoryColor(transaction.category) }"
              >
                <q-icon :name="getCategoryIcon(transaction.category)" size="20px" color="white" />
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

const eventsStore = useEventsStore()

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

function getCategoryColor(category) {
  const colors = {
    HOUSING: 'rgba(255, 167, 38, 0.8)',
    MORTGAGE: 'rgba(255, 167, 38, 0.8)',
    'FOOD & DINING': 'rgba(76, 175, 80, 0.8)',
    'FOOD & DRINKS': 'rgba(76, 175, 80, 0.8)',
    GROCERIES: 'rgba(66, 165, 245, 0.8)',
    TRANSPORTATION: 'rgba(156, 39, 176, 0.8)',
    ENTERTAINMENT: 'rgba(233, 30, 99, 0.8)',
    SHOPPING: 'rgba(255, 193, 7, 0.8)',
    UTILITIES: 'rgba(96, 125, 139, 0.8)',
    UTILITY: 'rgba(96, 125, 139, 0.8)',
    HEALTHCARE: 'rgba(244, 67, 54, 0.8)',
    INSURANCE: 'rgba(255, 152, 0, 0.8)',
    GYM: 'rgba(233, 30, 99, 0.8)',
    EDUCATION: 'rgba(103, 58, 183, 0.8)',
    SAVINGS: 'rgba(76, 175, 80, 0.8)',
    SALARY: 'rgba(76, 175, 80, 0.8)',
    INCOME: 'rgba(76, 175, 80, 0.8)',
    MISCELLANEOUS: 'rgba(158, 158, 158, 0.8)',
  }
  return colors[category?.toUpperCase()] || 'rgba(168, 85, 247, 0.7)'
}

function getCategoryIcon(category) {
  const icons = {
    HOUSING: 'home',
    MORTGAGE: 'home',
    'FOOD & DINING': 'restaurant',
    'FOOD & DRINKS': 'restaurant',
    GROCERIES: 'local_grocery_store',
    TRANSPORTATION: 'directions_car',
    ENTERTAINMENT: 'movie',
    SHOPPING: 'shopping_bag',
    UTILITIES: 'bolt',
    UTILITY: 'bolt',
    HEALTHCARE: 'local_hospital',
    INSURANCE: 'favorite',
    GYM: 'fitness_center',
    EDUCATION: 'school',
    SAVINGS: 'savings',
    SALARY: 'attach_money',
    INCOME: 'attach_money',
    MISCELLANEOUS: 'category',
  }
  return icons[category?.toUpperCase()] || 'receipt'
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
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
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
  background: rgba(40, 40, 45, 0.95);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.08);
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
      color: white;
      letter-spacing: -0.3px;
    }

    .transaction-count {
      font-size: 0.75rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.6);
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
  background: rgba(40, 40, 45, 0.95);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.08);
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
  color: white;

  &.positive {
    color: #4caf50;
  }

  &.negative {
    color: #f44336;
  }
}

.summary-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
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
  color: white;
}

.day-total {
  font-size: 1rem;
  font-weight: 600;
  color: white;
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
  background: rgba(40, 40, 45, 0.95);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: rgba(50, 50, 55, 0.95);
    border-color: rgba(255, 255, 255, 0.15);
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
  color: white;
}

.transaction-category {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.transaction-amount {
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

.no-data {
  padding: 3rem 1.5rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
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
