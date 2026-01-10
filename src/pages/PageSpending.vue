<template>
  <q-page class="spending-page">
    <div class="spending-container">
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

      <!-- Categories Chart -->
      <q-card class="chart-card glass-card">
        <q-card-section>
          <div class="chart-header">
            <q-btn
              :label="transactionType === 'DEBIT' ? 'EXPENSES' : 'INCOME'"
              icon-right="expand_more"
              class="type-toggle-btn-small"
              unelevated
              no-caps
              size="sm"
              dense
            >
              <q-menu anchor="bottom left" self="top left">
                <q-list class="type-menu">
                  <q-item
                    clickable
                    v-close-popup
                    @click="transactionType = 'DEBIT'"
                    class="type-menu-item"
                  >
                    <q-item-section>
                      <q-item-label>Expenses</q-item-label>
                    </q-item-section>
                    <q-item-section side v-if="transactionType === 'DEBIT'">
                      <q-icon name="check" color="primary" />
                    </q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    @click="transactionType = 'CREDIT'"
                    class="type-menu-item"
                  >
                    <q-item-section>
                      <q-item-label>Income</q-item-label>
                    </q-item-section>
                    <q-item-section side v-if="transactionType === 'CREDIT'">
                      <q-icon name="check" color="primary" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
          <div class="chart-container">
            <Pie :data="categoriesData" :options="chartOptions" />
          </div>
        </q-card-section>
      </q-card>

      <!-- Categories List with Expandable Items -->
      <div class="category-list-container">
        <div v-for="category in categoryBreakdown" :key="category.name">
          <!-- Category Header -->
          <div
            class="category-list-item"
            :class="{ expanded: expandedCategories.has(category.name) }"
            @click="toggleCategory(category.name)"
          >
            <div class="category-left">
              <div class="category-color-dot" :style="{ backgroundColor: category.color }"></div>
              <span class="category-name-text">{{ category.name }}</span>
            </div>
            <div class="category-right">
              <span class="category-amount-text">{{ formatCurrency(category.amount) }}</span>
              <q-icon
                name="expand_more"
                size="20px"
                color="rgba(255, 255, 255, 0.5)"
                :class="{ 'rotate-icon': expandedCategories.has(category.name) }"
              />
            </div>
          </div>

          <!-- Expanded Transactions -->
          <div v-if="expandedCategories.has(category.name)" class="category-transactions">
            <div
              v-for="transaction in getCategoryTransactions(category.name)"
              :key="transaction.id || transaction._id"
              class="transaction-list-item"
              @click.stop="viewTransaction(transaction)"
            >
              <div class="transaction-left">
                <div
                  class="transaction-icon"
                  :style="{
                    backgroundColor: category.color,
                  }"
                >
                  <q-icon :name="getCategoryIcon(transaction.category)" size="18px" color="white" />
                </div>
                <div class="transaction-info">
                  <span class="transaction-name">{{
                    transaction.name || 'Unnamed Transaction'
                  }}</span>
                  <span class="transaction-date">{{ formatDate(transaction.date) }}</span>
                </div>
              </div>
              <div class="transaction-right">
                <span class="transaction-amount negative">
                  {{ formatCurrency(getEventDisplayAmount(transaction)) }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="categoryBreakdown.length === 0" class="no-data">
          <span
            >No {{ transactionType === 'DEBIT' ? 'expense' : 'income' }} data available for the
            selected period</span
          >
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useEventsStore } from '../stores/events'

ChartJS.register(ArcElement, Tooltip, Legend)

const eventsStore = useEventsStore()

const loading = ref(false)
const expandedCategories = ref(new Set())
const selectedMonth = ref(new Date().getMonth()) // 0-11
const selectedYear = ref(new Date().getFullYear())
const transactionType = ref('DEBIT') // 'DEBIT' for expenses, 'CREDIT' for income

// The store's filteredEvents are already filtered by the selected month
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

const categoriesData = computed(() => {
  const categoryTotals = {}

  if (!filteredEvents.value || !Array.isArray(filteredEvents.value)) {
    return {
      labels: [],
      datasets: [{ data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }],
    }
  }

  filteredEvents.value.forEach((event) => {
    if (event.type === transactionType.value && event.category) {
      const category = toTitleCase(event.category)
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0
      }
      const displayAmount = getEventDisplayAmount(event)
      categoryTotals[category] += parseFloat(displayAmount || 0)
    }
  })

  const categories = Object.keys(categoryTotals)
  const colors = generateColors(categories.length)

  return {
    labels: categories,
    datasets: [
      {
        data: Object.values(categoryTotals),
        backgroundColor: colors,
        borderColor: colors.map((c) => c.replace('0.7', '0.9')),
        borderWidth: 2,
      },
    ],
  }
})

const categoryBreakdown = computed(() => {
  if (!filteredEvents.value || !Array.isArray(filteredEvents.value)) {
    return []
  }

  const categoryTotals = {}
  let total = 0

  filteredEvents.value.forEach((event) => {
    if (event.type === transactionType.value && event.category) {
      const category = toTitleCase(event.category)
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0
      }
      const displayAmount = getEventDisplayAmount(event)
      const amount = parseFloat(displayAmount || 0)
      categoryTotals[category] += amount
      total += amount
    }
  })

  const colors = generateColors(Object.keys(categoryTotals).length)

  return Object.entries(categoryTotals)
    .map(([name, amount], index) => ({
      name,
      amount,
      percentage: total > 0 ? ((amount / total) * 100).toFixed(1) : 0,
      color: colors[index],
    }))
    .sort((a, b) => b.amount - a.amount)
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: 'rgba(255, 255, 255, 0.9)',
        padding: 15,
        font: {
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(30, 30, 30, 0.95)',
      titleColor: 'rgba(255, 255, 255, 0.9)',
      bodyColor: 'rgba(255, 255, 255, 0.8)',
      borderColor: 'rgba(168, 85, 247, 0.5)',
      borderWidth: 1,
      padding: 12,
      callbacks: {
        label: function (context) {
          let label = context.label || ''
          if (label) {
            label += ': '
          }
          if (context.parsed !== null) {
            label += new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(context.parsed)
          }
          return label
        },
      },
    },
  },
}

function toTitleCase(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function generateColors(count) {
  const colors = [
    'rgba(168, 85, 247, 0.7)',
    'rgba(147, 51, 234, 0.7)',
    'rgba(126, 34, 206, 0.7)',
    'rgba(107, 114, 228, 0.7)',
    'rgba(99, 102, 241, 0.7)',
    'rgba(59, 130, 246, 0.7)',
    'rgba(14, 165, 233, 0.7)',
    'rgba(6, 182, 212, 0.7)',
    'rgba(20, 184, 166, 0.7)',
    'rgba(16, 185, 129, 0.7)',
    'rgba(34, 197, 94, 0.7)',
    'rgba(132, 204, 22, 0.7)',
    'rgba(234, 179, 8, 0.7)',
    'rgba(251, 146, 60, 0.7)',
    'rgba(249, 115, 22, 0.7)',
    'rgba(239, 68, 68, 0.7)',
  ]
  return Array.from({ length: count }, (_, i) => colors[i % colors.length])
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  const options = { month: 'short', day: 'numeric' }
  return date.toLocaleDateString('en-US', options)
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

function getCategoryIcon(category) {
  const icons = {
    HOUSING: 'home',
    MORTGAGE: 'home',
    'FOOD & DINING': 'restaurant',
    'FOOD & DRINKS': 'restaurant',
    TRANSPORTATION: 'directions_car',
    ENTERTAINMENT: 'movie',
    SHOPPING: 'shopping_bag',
    UTILITIES: 'bolt',
    UTILITY: 'bolt',
    HEALTHCARE: 'local_hospital',
    EDUCATION: 'school',
    SAVINGS: 'savings',
    MISCELLANEOUS: 'category',
  }
  return icons[category?.toUpperCase()] || 'receipt'
}

function toggleCategory(categoryName) {
  if (expandedCategories.value.has(categoryName)) {
    expandedCategories.value.delete(categoryName)
  } else {
    expandedCategories.value.add(categoryName)
  }
  // Trigger reactivity
  expandedCategories.value = new Set(expandedCategories.value)
}

function getCategoryTransactions(categoryName) {
  if (!filteredEvents.value || !Array.isArray(filteredEvents.value)) {
    return []
  }

  return filteredEvents.value
    .filter((event) => {
      if (event.type !== transactionType.value) return false
      const eventCategory = toTitleCase(event.category)
      return eventCategory === categoryName
    })
    .sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateB - dateA
    })
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
  // Clear expanded categories when changing months
  expandedCategories.value = new Set()

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
  // Clear expanded categories when changing months
  expandedCategories.value = new Set()

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
.spending-page {
  padding: 1rem;
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
  position: relative;
  padding-bottom: 2rem;
}

.spending-container {
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

.chart-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.25rem;
}

.type-toggle-btn-small {
  background: rgba(50, 50, 55, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 0.375rem 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(60, 60, 65, 0.9);
  }

  :deep(.q-icon) {
    font-size: 16px;
    margin-left: 0.25rem;
  }

  :deep(.q-btn__content) {
    padding: 0;
  }
}

.type-menu {
  background: rgba(30, 30, 35, 0.98);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.5rem;
  min-width: 150px;
}

.type-menu-item {
  color: white;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  :deep(.q-item__label) {
    font-size: 0.95rem;
  }
}

.chart-card {
  background: rgba(40, 40, 45, 0.95) !important;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;

  :deep(.q-card__section) {
    padding: 1.5rem;
  }
}

.chart-container {
  height: 350px;
  position: relative;
}

.category-list-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.category-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: rgba(40, 40, 45, 0.95);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;

  &.expanded {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom: none;
  }
}

.transaction-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: rgba(40, 40, 45, 0.95);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
  cursor: pointer;

  &:active {
    transform: scale(0.98);
    background: rgba(50, 50, 55, 0.95);
  }
}

.category-left,
.transaction-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.category-color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.category-name-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  font-weight: 500;
}

.category-right,
.transaction-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-amount-text {
  color: white;
  font-size: 1rem;
  font-weight: 600;
}

.rotate-icon {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}

.category-transactions {
  background: rgba(40, 40, 45, 0.95);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-top: none;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;

  .transaction-list-item {
    border: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(50, 50, 55, 0.5);
    padding: 0.875rem 1rem;

    &:hover {
      background: rgba(60, 60, 65, 0.6);
      border-color: rgba(168, 85, 247, 0.3);
    }
  }
}

.transaction-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.transaction-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.transaction-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  font-weight: 500;
}

.transaction-date {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
}

.transaction-amount {
  color: white;
  font-size: 1rem;
  font-weight: 600;

  &.positive {
    color: #4caf50;
  }

  &.negative {
    color: white;
  }
}

.no-data {
  padding: 2rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

// Mobile optimization
@media (max-width: 600px) {
  .spending-page {
    padding: 0.75rem;
  }

  .chart-card {
    border-radius: 20px;

    :deep(.q-card__section) {
      padding: 1.25rem;
    }
  }

  .chart-title {
    font-size: 1.25rem;
  }

  .chart-container {
    height: 300px;
  }

  .view-toggle {
    :deep(.q-btn) {
      padding: 0.6rem 1.2rem;
      font-size: 0.7rem;
    }
  }

  .category-list-item,
  .transaction-list-item {
    padding: 0.85rem 1rem;
    border-radius: 14px;
  }

  .category-name-text,
  .transaction-name {
    font-size: 0.85rem;
  }

  .category-amount-text,
  .transaction-amount {
    font-size: 0.9rem;
  }

  .transaction-icon {
    width: 36px;
    height: 36px;
  }

  .transaction-date {
    font-size: 0.75rem;
  }
}

@media (min-width: 1024px) {
  .spending-page {
    padding: 2rem;
  }

  .chart-container {
    height: 400px;
  }
}
</style>
