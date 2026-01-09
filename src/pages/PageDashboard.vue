<template>
  <q-page class="dashboard-page">
    <div class="dashboard-container">
      <!-- Mobile Menu Toggle -->
      <q-btn
        v-if="$q.screen.lt.md"
        flat
        dense
        round
        icon="menu"
        class="mobile-menu-btn"
        @click="$emit('toggle-menu')"
      />

      <!-- Loading State -->
      <q-inner-loading :showing="loading" />

      <!-- Stats Grid -->
      <div class="stats-grid q-mb-lg">
        <q-card class="stat-card glass-card">
          <q-card-section class="flex items-center q-pa-md">
            <q-icon name="account_balance_wallet" class="stat-icon q-mr-md" />
            <div class="stat-content">
              <h3>Monthly Balance</h3>
              <p class="stat-value" :class="monthlyBalance >= 0 ? 'text-positive' : 'text-negative'">
                {{ formatCurrency(monthlyBalance) }}
              </p>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="stat-card glass-card">
          <q-card-section class="flex items-center q-pa-md">
            <q-icon name="savings" class="stat-icon q-mr-md" />
            <div class="stat-content">
              <h3>Savings</h3>
              <p class="stat-value positive text-positive">{{ formatCurrency(monthlySavings) }}</p>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="stat-card glass-card">
          <q-card-section class="flex items-center q-pa-md">
            <q-icon name="trending_up" class="stat-icon q-mr-md" />
            <div class="stat-content">
              <h3>Income</h3>
              <p class="stat-value positive text-positive">{{ formatCurrency(monthlyIncome) }}</p>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="stat-card glass-card">
          <q-card-section class="flex items-center q-pa-md">
            <q-icon name="trending_down" class="stat-icon q-mr-md" />
            <div class="stat-content">
              <h3>Expenses</h3>
              <p class="stat-value negative text-negative">{{ formatCurrency(monthlyExpenses) }}</p>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Charts Row -->
      <div class="charts-row q-mb-lg">
        <q-card class="chart-card glass-card">
          <q-card-section>
            <h3 class="chart-title">Income vs Expenses</h3>
            <div class="chart-container">
              <Pie :data="chartData" :options="chartOptions" />
            </div>
          </q-card-section>
        </q-card>

        <q-card class="scenarios-card glass-card">
          <q-card-section>
            <h3 class="chart-title">Scenario Toggles</h3>
            <div class="scenarios-container">
              <div class="scenarios-header">
                <q-icon name="layers" class="scenarios-icon" />
                <span class="scenarios-subtitle">Combine scenarios to include their events in calculations</span>
              </div>
              <div class="scenarios-list">
                <div class="scenario-item default-scenario">
                  <q-item-label class="scenario-label">Base Budget</q-item-label>
                  <q-icon name="check_circle" class="default-scenario-icon" color="positive" />
                </div>
                <div
                  v-for="scenario in availableScenarios"
                  :key="scenario.id"
                  class="scenario-item"
                >
                  <q-item-label class="scenario-label">{{ scenario.name }}</q-item-label>
                  <q-toggle
                    :model-value="activeScenarios.has(scenario.id)"
                    @update:model-value="toggleScenario(scenario)"
                    color="primary"
                  />
                </div>
                <div v-if="availableScenarios.length === 0" class="no-scenarios">
                  <q-item-label>No additional scenarios available</q-item-label>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="chart-card glass-card">
          <q-card-section>
            <h3 class="chart-title">Expense Categories</h3>
            <div class="chart-container">
              <Pie :data="expenseCategoriesData" :options="chartOptions" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Date Range Filter -->
      <q-card class="glass-card q-mb-lg">
        <q-card-section>
          <div class="date-range-filters">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <div class="text-subtitle2 q-mb-sm">Start Date</div>
                <div class="row q-col-gutter-sm">
                  <div class="col-4">
                    <q-select
                      v-model="startMonth"
                      :options="monthOptions"
                      label="Month"
                      outlined
                      dense
                      @update:model-value="updateFilteredData"
                    />
                  </div>
                  <div class="col-4">
                    <q-select
                      v-model="startDay"
                      :options="availableDays"
                      label="Day"
                      outlined
                      dense
                      @update:model-value="updateFilteredData"
                    />
                  </div>
                  <div class="col-4">
                    <q-select
                      v-model="startYear"
                      :options="years"
                      label="Year"
                      outlined
                      dense
                      @update:model-value="updateFilteredData"
                    />
                  </div>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="text-subtitle2 q-mb-sm">End Date</div>
                <div class="row q-col-gutter-sm">
                  <div class="col-4">
                    <q-select
                      v-model="endMonth"
                      :options="monthOptions"
                      label="Month"
                      outlined
                      dense
                      @update:model-value="updateFilteredData"
                    />
                  </div>
                  <div class="col-4">
                    <q-select
                      v-model="endDay"
                      :options="availableEndDays"
                      label="Day"
                      outlined
                      dense
                      @update:model-value="updateFilteredData"
                    />
                  </div>
                  <div class="col-4">
                    <q-select
                      v-model="endYear"
                      :options="years"
                      label="Year"
                      outlined
                      dense
                      @update:model-value="updateFilteredData"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Transaction History -->
      <q-card class="glass-card">
        <q-card-section>
          <div class="flex justify-between items-center q-mb-md">
            <h3 class="chart-title q-ma-none">Transaction History</h3>
            <q-btn
              flat
              dense
              :icon="transactionHistoryExpanded ? 'expand_less' : 'expand_more'"
              :label="transactionHistoryExpanded ? 'Hide' : 'Show'"
              @click="toggleTransactionHistory"
            />
          </div>

          <div v-if="transactionHistoryExpanded">
            <q-table
              :rows="sortedFilteredEvents"
              :columns="columns"
              row-key="id"
              flat
              class="transaction-table"
              :rows-per-page-options="[10, 25, 50]"
            >
              <template v-slot:body-cell-amount="props">
                <q-td :props="props">
                  <span :class="props.row.type === 'CREDIT' ? 'text-positive' : 'text-negative'">
                    {{ formatCurrency(getEventDisplayAmount(props.row)) }}
                  </span>
                </q-td>
              </template>
            </q-table>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useProfileStore } from '../stores/profile'
import { useScenariosStore } from '../stores/scenarios'
import { useEventsStore } from '../stores/events'
import axios from 'axios'
import { getAPIURL } from '../js/api'

ChartJS.register(ArcElement, Tooltip, Legend)

const $q = useQuasar()
const router = useRouter()
const profileStore = useProfileStore()
const scenariosStore = useScenariosStore()
const eventsStore = useEventsStore()

const loading = ref(false)
const activeScenarios = ref(new Set(['default']))
const combinedActiveEvents = ref([])
const startMonth = ref(null)
const startDay = ref(null)
const startYear = ref(null)
const endMonth = ref(null)
const endDay = ref(null)
const endYear = ref(null)
const transactionHistoryExpanded = ref(true)

const months = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
]

const years = Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - 20 + i)

const monthOptions = computed(() => months.map((m) => ({ label: m.label, value: m.value })))

const columns = [
  { name: 'date', label: 'Date', field: 'date', align: 'left', sortable: true },
  { name: 'description', label: 'Description', field: 'name', align: 'left' },
  { name: 'category', label: 'Category', field: 'category', align: 'left' },
  { name: 'type', label: 'Type', field: 'type', align: 'left' },
  { name: 'amount', label: 'Amount', field: 'amount', align: 'right' },
]

const currentProfile = computed(() => profileStore.currentProfile)
const selectedScenario = computed(() => scenariosStore.selectedScenario)
const customScenarios = computed(() => scenariosStore.customScenarios)
const filteredEvents = computed(() => eventsStore.filteredEvents)

const availableScenarios = computed(() => customScenarios.value)

const availableDays = computed(() => {
  const month = startMonth.value !== null ? startMonth.value : new Date().getMonth()
  const year = startYear.value !== null ? startYear.value : new Date().getFullYear()
  const lastDay = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: lastDay }, (_, i) => i + 1)
})

const availableEndDays = computed(() => {
  const month = endMonth.value !== null ? endMonth.value : new Date().getMonth()
  const year = endYear.value !== null ? endYear.value : new Date().getFullYear()
  const lastDay = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: lastDay }, (_, i) => i + 1)
})

const sortedFilteredEvents = computed(() => {
  const eventsToUse =
    combinedActiveEvents.value.length > 0 ? combinedActiveEvents.value : filteredEvents.value
  if (!eventsToUse || !Array.isArray(eventsToUse)) {
    return []
  }
  const events = [...eventsToUse]
  return events.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateB - dateA
  })
})

const monthlyIncome = computed(() => {
  const eventsToUse =
    combinedActiveEvents.value.length > 0 ? combinedActiveEvents.value : filteredEvents.value
  if (!eventsToUse || !Array.isArray(eventsToUse)) return 0

  return eventsToUse
    .filter((event) => event.type === 'CREDIT')
    .reduce((total, event) => total + parseFloat(event.amount || 0), 0)
})

const monthlyExpenses = computed(() => {
  const eventsToUse =
    combinedActiveEvents.value.length > 0 ? combinedActiveEvents.value : filteredEvents.value
  if (!eventsToUse || !Array.isArray(eventsToUse)) return 0

  return eventsToUse
    .filter((event) => event.type === 'DEBIT')
    .reduce((total, event) => total + parseFloat(event.amount || 0), 0)
})

const monthlySavings = computed(() => {
  const eventsToUse =
    combinedActiveEvents.value.length > 0 ? combinedActiveEvents.value : filteredEvents.value
  if (!eventsToUse || !Array.isArray(eventsToUse)) return 0

  return eventsToUse
    .filter((event) => event.category === 'SAVINGS')
    .reduce((total, event) => total + parseFloat(event.amount || 0), 0)
})

const monthlyBalance = computed(() => monthlyIncome.value - monthlyExpenses.value)

const chartData = computed(() => ({
  labels: ['Income', 'Expenses'],
  datasets: [
    {
      data: [monthlyIncome.value, monthlyExpenses.value],
      backgroundColor: ['#4CAF50', '#F44336'],
      borderColor: ['#4CAF50', '#F44336'],
      borderWidth: 1,
    },
  ],
}))

const expenseCategoriesData = computed(() => {
  const eventsToUse =
    combinedActiveEvents.value.length > 0 ? combinedActiveEvents.value : filteredEvents.value
  const categoryTotals = {}

  if (!eventsToUse || !Array.isArray(eventsToUse)) {
    return {
      labels: [],
      datasets: [{ data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }],
    }
  }

  eventsToUse.forEach((event) => {
    if (event.type === 'DEBIT' && event.category) {
      const category = toTitleCase(event.category)
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0
      }
      categoryTotals[category] += parseFloat(event.amount || 0)
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
        borderColor: colors,
        borderWidth: 1,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: 'rgba(255, 255, 255, 0.9)',
      },
    },
  },
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
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
    '#FFB6C1',
    '#98FB98',
    '#87CEEB',
    '#DDA0DD',
    '#F0E68C',
    '#FFA07A',
    '#B0E0E6',
    '#FFC0CB',
    '#90EE90',
    '#E6E6FA',
  ]
  return Array.from({ length: count }, (_, i) => colors[i % colors.length])
}

function getEventDisplayAmount(event) {
  if (event.amount !== undefined && event.amount !== null) {
    return event.amount
  }

  const loanCategories = ['MORTGAGE', 'GENERIC_LOAN', 'AUTO_LOAN']
  if (
    loanCategories.includes(event.category) &&
    event.monthly_payment &&
    event.monthly_payment > 0
  ) {
    if (event.category === 'MORTGAGE' && event.escrow && event.escrow > 0) {
      return parseFloat(event.monthly_payment) + parseFloat(event.escrow)
    }
    return event.monthly_payment
  }
  return event.amount
}

function toggleTransactionHistory() {
  transactionHistoryExpanded.value = !transactionHistoryExpanded.value
}

function initializeDateRangeToCurrentMonth() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  startMonth.value = month
  startDay.value = 1
  startYear.value = year
  const lastDay = new Date(year, month + 1, 0)
  endMonth.value = month
  endDay.value = lastDay.getDate()
  endYear.value = year
}

function hasDateRangeFilter() {
  return (
    startMonth.value !== null &&
    startDay.value !== null &&
    startYear.value !== null &&
    endMonth.value !== null &&
    endDay.value !== null &&
    endYear.value !== null
  )
}

async function updateFilteredData() {
  if (!hasDateRangeFilter()) {
    initializeDateRangeToCurrentMonth()
  }

  const startDate = new Date(Date.UTC(startYear.value, startMonth.value, startDay.value))
  const endDate = new Date(Date.UTC(endYear.value, endMonth.value, endDay.value))
  await eventsStore.fetchEventsForDateRange(startDate, endDate)
  await updateScenarioData()
}

async function updateScenarioData() {
  combinedActiveEvents.value = await getAllActiveScenarioEvents()
  eventsStore.setFilteredEvents(combinedActiveEvents.value)
}

async function getAllActiveScenarioEvents() {
  const allEvents = []
  const seenEvents = new Set()

  if (!currentProfile.value) return allEvents

  const profileID = currentProfile.value.id

  let startDate, endDate
  if (hasDateRangeFilter()) {
    startDate = new Date(Date.UTC(startYear.value, startMonth.value, startDay.value))
    endDate = new Date(Date.UTC(endYear.value, endMonth.value, endDay.value))
  } else {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    startDate = new Date(currentYear, currentMonth, 1)
    endDate = new Date(currentYear, currentMonth + 1, 0)
  }

  try {
    for (const scenarioId of activeScenarios.value) {
      const actualScenarioId =
        scenarioId === 'default' ? selectedScenario.value?.id : scenarioId
      if (!actualScenarioId) continue

      const monthsToFetch = []
      const startYear = startDate.getUTCFullYear()
      const startMonth = startDate.getUTCMonth()
      const endYear = endDate.getUTCFullYear()
      const endMonth = endDate.getUTCMonth()

      let currentYear = startYear
      let currentMonth = startMonth

      while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        monthsToFetch.push({ year: currentYear, month: currentMonth })
        currentMonth++
        if (currentMonth > 11) {
          currentMonth = 0
          currentYear++
        }
      }

      for (const { year, month } of monthsToFetch) {
        const response = await axios.get(
          `${getAPIURL()}/api/scenario/get-events-for-scenario-for-month`,
          {
            params: {
              scenarioID: actualScenarioId,
              profileID,
              month: month,
              year: year,
            },
          }
        )

        if (response.data && response.data.length > 0) {
          response.data.forEach((eventData) => {
            if (eventData.occurrences && eventData.occurrences.length > 0) {
              eventData.occurrences.forEach((occurrence) => {
                let occurrenceDate
                if (typeof occurrence === 'string') {
                  if (occurrence.includes('T')) {
                    const datePart = occurrence.split('T')[0]
                    const [year, month, day] = datePart.split('-').map(Number)
                    occurrenceDate = new Date(Date.UTC(year, month - 1, day))
                  } else {
                    const [year, month, day] = occurrence.split('-').map(Number)
                    occurrenceDate = new Date(Date.UTC(year, month - 1, day))
                  }
                } else {
                  occurrenceDate = new Date(occurrence)
                }

                const occurrenceDateString = occurrenceDate.toISOString().split('T')[0]
                const startDateString = startDate.toISOString().split('T')[0]
                const endDateString = endDate.toISOString().split('T')[0]

                if (
                  occurrenceDateString >= startDateString &&
                  occurrenceDateString <= endDateString
                ) {
                  const loanCategories = ['MORTGAGE', 'GENERIC_LOAN', 'AUTO_LOAN']
                  const monthlyPayment =
                    eventData.event.monthly_payment || eventData.event.monthlyPayment
                  let displayAmount
                  if (
                    loanCategories.includes(eventData.event.category) &&
                    monthlyPayment &&
                    monthlyPayment > 0
                  ) {
                    if (
                      eventData.event.category === 'MORTGAGE' &&
                      eventData.event.escrow &&
                      eventData.event.escrow > 0
                    ) {
                      displayAmount = parseFloat(monthlyPayment) + parseFloat(eventData.event.escrow)
                    } else {
                      displayAmount = monthlyPayment
                    }
                  } else {
                    displayAmount = eventData.event.amount
                  }

                  const eventToAdd = {
                    ...eventData.event,
                    amount: displayAmount,
                    date: occurrenceDateString,
                  }

                  const uniqueKey = `${eventData.event.id || eventData.event._id}-${occurrenceDateString}-${eventData.event.name || eventData.event.description || ''}`

                  if (!seenEvents.has(uniqueKey)) {
                    seenEvents.add(uniqueKey)
                    allEvents.push(eventToAdd)
                  }
                }
              })
            }
          })
        }
      }
    }
  } catch (error) {
    console.error('Error fetching events for active scenarios:', error)
  }

  return allEvents
}

async function toggleScenario(scenario) {
  const wasActive = activeScenarios.value.has(scenario.id)

  if (wasActive) {
    activeScenarios.value.delete(scenario.id)
  } else {
    activeScenarios.value.add(scenario.id)
  }

  await updateScenarioData()
}

async function initializeDashboard() {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const userID = localStorage.getItem('userID')
    if (!userID) {
      router.push('/login')
      return
    }

    loading.value = true

    await profileStore.fetchProfiles()

    const userProfile = profileStore.profiles.find((p) => p.id == userID || p._id == userID)
    if (userProfile) {
      await profileStore.setCurrentProfile(userProfile)
    } else {
      await profileStore.setCurrentProfile({ id: userID })
    }

    await loadProfileData()
  } catch (error) {
    console.error('Error initializing dashboard:', error)
    router.push('/login')
  } finally {
    loading.value = false
  }
}

async function loadProfileData() {
  try {
    if (currentProfile.value) {
      scenariosStore.setProfile(currentProfile.value)
      eventsStore.setProfile(currentProfile.value)

      await scenariosStore.fetchScenarios()
      await scenariosStore.selectDefaultScenario()

      if (!hasDateRangeFilter()) {
        initializeDateRangeToCurrentMonth()
      }

      if (hasDateRangeFilter()) {
        const startDate = new Date(Date.UTC(startYear.value, startMonth.value, startDay.value))
        const endDate = new Date(Date.UTC(endYear.value, endMonth.value, endDay.value))
        await eventsStore.fetchEventsForDateRange(startDate, endDate)
      } else {
        await eventsStore.fetchEventsForMonthByScenario()
      }

      if (!activeScenarios.value.has('default')) {
        activeScenarios.value.add('default')
      }

      await updateScenarioData()
    }
  } catch (error) {
    console.error('Error loading profile data:', error)
  }
}

onMounted(async () => {
  await initializeDashboard()
})

watch(currentProfile, async (newProfile) => {
  if (newProfile) {
    await loadProfileData()
  } else {
    router.push('/login')
  }
})
</script>

<style scoped lang="scss">
.dashboard-page {
  padding: 2rem;
  min-height: 100vh;
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

.mobile-menu-btn {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 100;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.chart-card,
.scenarios-card {
  min-height: 400px;
}

.chart-container {
  height: 300px;
  position: relative;
}

.chart-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 1rem;
}

.scenarios-container {
  margin-top: 1rem;
}

.scenarios-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.scenarios-icon {
  font-size: 1.5rem;
  color: rgba(33, 150, 243, 0.8);
}

.scenarios-subtitle {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.scenarios-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.scenario-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.default-scenario {
    background: rgba(76, 175, 80, 0.2);
    border: 1px solid rgba(76, 175, 80, 0.4);
  }
}

.scenario-label {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.default-scenario-icon {
  font-size: 1.5rem;
}

.no-scenarios {
  padding: 1rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.date-range-filters {
  .text-subtitle2 {
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>
