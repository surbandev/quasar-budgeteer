<template>
  <q-page class="dashboard-page">
    <div class="dashboard-container">
      <!-- Loading State -->
      <q-inner-loading :showing="loading" />

      <!-- Spent This Month Chart with Snapshot -->
      <SpentThisMonthChart
        :totalSpent="monthlyExpenses"
        :spentData="dailySpendingData"
        :monthlyBalance="monthlyBalance"
        :monthlySavings="monthlySavings"
        :monthlyIncome="monthlyIncome"
        :monthlyExpenses="monthlyExpenses"
        :availableScenarios="availableScenarios"
        :activeScenarios="activeScenarios"
        @toggleScenario="toggleScenario"
        @deleteScenario="deleteScenario"
      />

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
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useProfileStore } from '../stores/profile'
import { useScenariosStore } from '../stores/scenarios'
import { useEventsStore } from '../stores/events'
import SpentThisMonthChart from '../components/SpentThisMonthChart.vue'
import axios from 'axios'
import { getAPIURL } from '../js/api'

const router = useRouter()
const $q = useQuasar()
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
const dailySpendingData = ref([])

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
  calculateDailySpending()
}

function calculateDailySpending() {
  const eventsToUse =
    combinedActiveEvents.value.length > 0 ? combinedActiveEvents.value : filteredEvents.value

  if (!eventsToUse || !Array.isArray(eventsToUse)) {
    dailySpendingData.value = []
    return
  }

  // Get the current month's date range
  const now = new Date()
  const year = endYear.value !== null ? endYear.value : now.getFullYear()
  const month = endMonth.value !== null ? endMonth.value : now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Initialize daily spending array
  const dailySpending = new Array(daysInMonth).fill(0)

  // Aggregate spending by day
  eventsToUse.forEach((event) => {
    if (event.type === 'DEBIT' && event.date) {
      const eventDate = new Date(event.date)
      const day = eventDate.getDate()
      const eventMonth = eventDate.getMonth()
      const eventYear = eventDate.getFullYear()

      // Only count if it's in the current month
      if (eventMonth === month && eventYear === year && day <= daysInMonth) {
        dailySpending[day - 1] += parseFloat(event.amount || 0)
      }
    }
  })

  dailySpendingData.value = dailySpending
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
      const actualScenarioId = scenarioId === 'default' ? selectedScenario.value?.id : scenarioId
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
          },
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
                      displayAmount =
                        parseFloat(monthlyPayment) + parseFloat(eventData.event.escrow)
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

async function deleteScenario(scenario) {
  $q.dialog({
    title: 'Delete Scenario',
    message: `Are you sure you want to delete "${scenario.name}"? This action cannot be undone.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await scenariosStore.deleteScenario(scenario.id)

      // Remove from active scenarios if it was active
      if (activeScenarios.value.has(scenario.id)) {
        activeScenarios.value.delete(scenario.id)
        await updateScenarioData()
      }

      $q.notify({
        type: 'positive',
        message: 'Scenario deleted successfully',
        position: 'top',
      })
    } catch (error) {
      console.error('Error deleting scenario:', error)
      $q.notify({
        type: 'negative',
        message: 'Failed to delete scenario',
        position: 'top',
      })
    }
  })
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
  padding: 1rem;
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
  position: relative;
  padding-bottom: 2rem;
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

// Mobile optimization
@media (max-width: 600px) {
  .dashboard-page {
    padding: 0.75rem;
  }
}

.charts-row {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.chart-card {
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  transition: all 0.3s ease;

  :deep(.q-card__section) {
    padding: 1.5rem;
  }
}

.chart-container {
  height: 280px;
  position: relative;
}

.chart-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 1.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// Responsive charts
@media (max-width: 600px) {
  .charts-row {
    gap: 1rem;
  }

  .chart-card {
    border-radius: 16px;

    :deep(.q-card__section) {
      padding: 1rem;
    }
  }

  .chart-container {
    height: 240px;
  }

  .chart-title {
    font-size: 0.95rem;
    margin-bottom: 1rem;
  }
}

@media (min-width: 768px) {
  .charts-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1200px) {
  .charts-row {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Glass card styling override */
:deep(.glass-card) {
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
}

:deep(.glass-card .q-card__section) {
  color: white;
}

/* Date range filters styling */
.date-range-filters {
  padding: 0.5rem 0;

  .text-subtitle2 {
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
    margin-bottom: 0.75rem;
    font-size: 0.85rem;
  }
}

:deep(.q-field) {
  .q-field__control {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    color: white;
    min-height: 48px;
  }

  .q-field__native,
  .q-field__input {
    color: white;
    padding: 0 0.75rem;
  }

  .q-field__label {
    color: rgba(255, 255, 255, 0.7);
  }

  .q-field__control:before,
  .q-field__control:after {
    display: none;
  }

  &.q-field--focused .q-field__control {
    border-color: rgba(168, 85, 247, 0.6);
  }
}

// Mobile optimization for date filters
@media (max-width: 600px) {
  .date-range-filters {
    :deep(.q-field) {
      .q-field__control {
        min-height: 44px;
        border-radius: 10px;
      }
    }
  }
}

/* Table styling */
:deep(.transaction-table) {
  background: transparent;
  color: white;
  border-radius: 12px;
  overflow: hidden;

  .q-table__top {
    color: white;
    padding: 1rem;
  }

  .q-table__title {
    font-size: 1.1rem;
    font-weight: 600;
  }

  thead tr th {
    color: rgba(255, 255, 255, 0.7);
    background: rgba(255, 255, 255, 0.05);
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 1rem 0.75rem;
  }

  tbody tr td {
    color: rgba(255, 255, 255, 0.9);
    border-color: rgba(255, 255, 255, 0.05);
    padding: 1rem 0.75rem;
  }

  tbody tr {
    transition: background 0.2s ease;

    &:active {
      background: rgba(255, 255, 255, 0.08);
    }
  }

  .text-positive {
    color: #4caf50;
    font-weight: 600;
  }

  .text-negative {
    color: #f44336;
    font-weight: 600;
  }
}

/* Button styling */
:deep(.q-btn) {
  color: white;
  border-radius: 10px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:active {
    transform: scale(0.98);
  }
}

// Mobile table optimization
@media (max-width: 600px) {
  :deep(.transaction-table) {
    thead tr th {
      padding: 0.75rem 0.5rem;
      font-size: 0.7rem;
    }

    tbody tr td {
      padding: 0.75rem 0.5rem;
      font-size: 0.85rem;
    }
  }
}

/* Toggle styling */
:deep(.q-toggle) {
  .q-toggle__track {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
  }

  &.q-toggle--truthy .q-toggle__track {
    background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
  }

  .q-toggle__thumb {
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
}

/* Select dropdown styling */
:deep(.q-select) {
  .q-field__control {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
  }

  .q-field__native,
  .q-field__input {
    color: white;
  }

  .q-icon {
    color: rgba(255, 255, 255, 0.7);
  }

  &.q-field--focused .q-field__control {
    border-color: rgba(168, 85, 247, 0.6);
    background: rgba(255, 255, 255, 0.08);
  }
}

/* Loading spinner */
:deep(.q-inner-loading) {
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 20px;
}

:deep(.q-spinner) {
  color: #a855f7;
  width: 48px;
  height: 48px;
}

// Tablet and desktop optimizations
@media (min-width: 1024px) {
  .dashboard-page {
    padding: 2rem;
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
