<template>
  <q-page class="overview-page">
    <div class="overview-container">
      <!-- Loading State -->
      <q-inner-loading :showing="loading" />

      <!-- Spent This Month Chart with Snapshot -->
      <SpentThisMonthChart
        class="spent-chart-wrapper"
        :totalSpent="monthlyExpenses"
        :spentData="dailySpendingData"
        :dailyIncome="dailyIncomeData"
        :dailyExpenses="dailyExpensesData"
        :monthlyBalance="monthlyBalance"
        :monthlySavings="monthlySavings"
        :monthlyIncome="monthlyIncome"
        :monthlyExpenses="monthlyExpenses"
        :totalExpensesLeft="totalExpensesLeftThisMonth"
        :availableScenarios="availableScenarios"
        :activeScenarios="activeScenarios"
        :profiles="allProfiles"
        :currentProfile="currentProfile"
        :startDate="startDate"
        :endDate="endDate"
        @toggleScenario="toggleScenario"
        @deleteScenario="deleteScenario"
        @profileChange="handleProfileChange"
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
                      option-label="label"
                      option-value="value"
                      emit-value
                      map-options
                      display-value=""
                      label="Month"
                      outlined
                      dense
                      dark
                      @update:model-value="updateFilteredData"
                    >
                      <template v-slot:selected>
                        <span v-if="startMonth">
                          {{
                            monthOptions.find((m) => m.value === startMonth)?.label || startMonth
                          }}
                        </span>
                      </template>
                    </q-select>
                  </div>
                  <div class="col-4">
                    <q-select
                      v-model="startDay"
                      :options="availableDays"
                      label="Day"
                      outlined
                      dense
                      dark
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
                      dark
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
                      option-label="label"
                      option-value="value"
                      emit-value
                      map-options
                      display-value=""
                      label="Month"
                      outlined
                      dense
                      dark
                      @update:model-value="updateFilteredData"
                    >
                      <template v-slot:selected>
                        <span v-if="endMonth">
                          {{ monthOptions.find((m) => m.value === endMonth)?.label || endMonth }}
                        </span>
                      </template>
                    </q-select>
                  </div>
                  <div class="col-4">
                    <q-select
                      v-model="endDay"
                      :options="availableEndDays"
                      label="Day"
                      outlined
                      dense
                      dark
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
                      dark
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
import { useConstantsStore } from '../stores/constants'
import SpentThisMonthChart from '../components/SpentThisMonthChart.vue'

const router = useRouter()
const $q = useQuasar()
const profileStore = useProfileStore()
const scenariosStore = useScenariosStore()
const eventsStore = useEventsStore()
const constantsStore = useConstantsStore()

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
const dailyIncomeData = ref([])
const dailyExpensesData = ref([])

const monthOptions = computed(() => constantsStore.getMonths)
const years = computed(() => constantsStore.getYears())

const currentProfile = computed(() => profileStore.currentProfile)
const allProfiles = computed(() => profileStore.profiles || [])
const customScenarios = computed(() => scenariosStore.customScenarios)
const filteredEvents = computed(() => eventsStore.filteredEvents)

const availableScenarios = computed(() => customScenarios.value)

const availableDays = computed(() => {
  const month = startMonth.value !== null ? startMonth.value - 1 : new Date().getMonth()
  const year = startYear.value !== null ? startYear.value : new Date().getFullYear()
  const lastDay = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: lastDay }, (_, i) => i + 1)
})

const availableEndDays = computed(() => {
  const month = endMonth.value !== null ? endMonth.value - 1 : new Date().getMonth()
  const year = endYear.value !== null ? endYear.value : new Date().getFullYear()
  const lastDay = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: lastDay }, (_, i) => i + 1)
})

// Use store values as single source of truth
const monthlyIncome = computed(() => eventsStore.monthlyIncome)
const monthlyExpenses = computed(() => eventsStore.monthlyExpenses)
const monthlySavings = computed(() => eventsStore.monthlySavings)
const monthlyBalance = computed(() => eventsStore.cashFlow)

// Calculate total expenses left this month (future expenses only, excluding income and savings)
// This matches the logic in UpcomingTransactions component
const totalExpensesLeftThisMonth = computed(() => {
  const eventsToUse =
    combinedActiveEvents.value.length > 0 ? combinedActiveEvents.value : filteredEvents.value
  if (!eventsToUse || !Array.isArray(eventsToUse)) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  today.setMinutes(0, 0, 0)
  today.setSeconds(0, 0)
  today.setMilliseconds(0)

  // Always use current month (not date range filter) to match Budget tab behavior
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  let total = 0

  // Helper function to get event display amount (matches UpcomingTransactions)
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

  eventsToUse.forEach((event) => {
    // Only process DEBIT (expenses), exclude CREDIT (income) and SAVINGS
    if (event.type !== 'DEBIT' || event.category === 'SAVINGS') return

    if (!event.date) return

    // Parse date properly to avoid UTC timezone issues (same as PageEntries fix)
    let eventDate
    if (typeof event.date === 'string' && event.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Parse YYYY-MM-DD as local date (not UTC)
      const [year, month, day] = event.date.split('-').map(Number)
      eventDate = new Date(year, month - 1, day)
    } else {
      eventDate = new Date(event.date)
    }

    eventDate.setHours(0, 0, 0, 0)
    eventDate.setMinutes(0, 0, 0)
    eventDate.setSeconds(0, 0)
    eventDate.setMilliseconds(0)

    // Only include future dates (strictly after today) within the current month range
    if (eventDate > today && eventDate >= start && eventDate <= end) {
      total += getEventDisplayAmount(event) || 0
    }
  })

  return total
})

// Computed properties for date range
const startDate = computed(() => {
  if (!hasDateRangeFilter()) return null
  const month = startMonth.value !== null ? startMonth.value - 1 : new Date().getMonth()
  const year = startYear.value !== null ? startYear.value : new Date().getFullYear()
  const day = startDay.value !== null ? startDay.value : 1
  const date = new Date(year, month, day)
  date.setHours(0, 0, 0, 0)
  return date
})

const endDate = computed(() => {
  if (!hasDateRangeFilter()) return null
  const month = endMonth.value !== null ? endMonth.value - 1 : new Date().getMonth()
  const year = endYear.value !== null ? endYear.value : new Date().getFullYear()
  const day = endDay.value !== null ? endDay.value : new Date(year, month + 1, 0).getDate()
  const date = new Date(year, month, day)
  date.setHours(0, 0, 0, 0)
  return date
})

// Helper function to get the maximum days in a month
// month should be 1-12 (not 0-11)
function getMaxDaysInMonth(month, year) {
  if (month === null || year === null) return 31
  // month is 1-12, so we use month (which becomes month index) to get last day of that month
  return new Date(year, month, 0).getDate()
}

// Validate and adjust start day when month or year changes
watch([startMonth, startYear], () => {
  if (startMonth.value !== null && startYear.value !== null && startDay.value !== null) {
    const maxDays = getMaxDaysInMonth(startMonth.value, startYear.value)
    if (startDay.value > maxDays) {
      startDay.value = maxDays
    }
  }
})

// Validate and adjust end day when month or year changes
watch([endMonth, endYear], () => {
  if (endMonth.value !== null && endYear.value !== null && endDay.value !== null) {
    const maxDays = getMaxDaysInMonth(endMonth.value, endYear.value)
    if (endDay.value > maxDays) {
      endDay.value = maxDays
    }
  }
})

function initializeDateRangeToCurrentMonth() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  startMonth.value = month + 1
  startDay.value = 1
  startYear.value = year
  const lastDay = new Date(year, month + 1, 0)
  endMonth.value = month + 1
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

  // Ensure values are numbers (defensive check)
  const startMonthNum =
    typeof startMonth.value === 'number' ? startMonth.value : parseInt(startMonth.value)
  let startDayNum = typeof startDay.value === 'number' ? startDay.value : parseInt(startDay.value)
  const startYearNum =
    typeof startYear.value === 'number' ? startYear.value : parseInt(startYear.value)
  const endMonthNum = typeof endMonth.value === 'number' ? endMonth.value : parseInt(endMonth.value)
  let endDayNum = typeof endDay.value === 'number' ? endDay.value : parseInt(endDay.value)
  const endYearNum = typeof endYear.value === 'number' ? endYear.value : parseInt(endYear.value)

  // Validate and clamp days to maximum days in the selected month
  const startMaxDays = getMaxDaysInMonth(startMonthNum, startYearNum)
  if (startDayNum > startMaxDays) {
    startDayNum = startMaxDays
    startDay.value = startMaxDays
  }

  const endMaxDays = getMaxDaysInMonth(endMonthNum, endYearNum)
  if (endDayNum > endMaxDays) {
    endDayNum = endMaxDays
    endDay.value = endMaxDays
  }

  const start = new Date(startYearNum, startMonthNum - 1, startDayNum)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endYearNum, endMonthNum - 1, endDayNum)
  end.setHours(0, 0, 0, 0)
  await eventsStore.fetchEventsForDateRange(start, end)
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
    dailyIncomeData.value = []
    dailyExpensesData.value = []
    return
  }

  // Get the date range
  const now = new Date()
  let start, end

  if (hasDateRangeFilter() && startDate.value && endDate.value) {
    start = new Date(startDate.value)
    end = new Date(endDate.value)
  } else {
    // Default to current month
    const year = now.getFullYear()
    const month = now.getMonth()
    start = new Date(year, month, 1)
    end = new Date(year, month + 1, 0)
  }

  // Ensure dates are set to midnight to avoid timezone issues
  start.setHours(0, 0, 0, 0)
  start.setMinutes(0, 0, 0)
  start.setSeconds(0, 0)
  start.setMilliseconds(0)
  end.setHours(0, 0, 0, 0)
  end.setMinutes(0, 0, 0)
  end.setSeconds(0, 0)
  end.setMilliseconds(0)

  // Calculate number of days in the range
  const timeDiff = end.getTime() - start.getTime()
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1

  // Initialize daily arrays for the entire range
  const dailySpending = new Array(daysDiff).fill(0)
  const dailyIncome = new Array(daysDiff).fill(0)
  const dailyExpenses = new Array(daysDiff).fill(0)

  // Helper function to get event display amount
  function getEventDisplayAmount(event) {
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
    return parseFloat(event.amount || 0)
  }

  // Aggregate income and expenses by day across the entire date range
  eventsToUse.forEach((event) => {
    if (!event.date) return

    // Parse date properly to avoid UTC timezone issues (same fix as PageEntries)
    let eventDate
    if (typeof event.date === 'string' && event.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Parse YYYY-MM-DD as local date (not UTC)
      const [year, month, day] = event.date.split('-').map(Number)
      eventDate = new Date(year, month - 1, day)
    } else {
      eventDate = new Date(event.date)
    }

    eventDate.setHours(0, 0, 0, 0)
    eventDate.setMinutes(0, 0, 0)
    eventDate.setSeconds(0, 0)
    eventDate.setMilliseconds(0)

    // Check if event is within the date range
    if (eventDate >= start && eventDate <= end) {
      // Calculate which day index this event falls on
      const dayIndex = Math.floor((eventDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      if (dayIndex >= 0 && dayIndex < daysDiff) {
        const amount = getEventDisplayAmount(event)

        if (event.type === 'CREDIT') {
          // Income
          dailyIncome[dayIndex] += amount
          dailySpending[dayIndex] += amount // Keep for backward compatibility
        } else if (event.type === 'DEBIT' && event.category !== 'SAVINGS') {
          // Expenses (excluding savings)
          dailyExpenses[dayIndex] += amount
          dailySpending[dayIndex] += amount // Keep for backward compatibility
        }
      }
    }
  })

  dailySpendingData.value = dailySpending
  dailyIncomeData.value = dailyIncome
  dailyExpensesData.value = dailyExpenses
}

async function getAllActiveScenarioEvents() {
  let startDate, endDate
  if (hasDateRangeFilter()) {
    startDate = new Date(Date.UTC(startYear.value, startMonth.value - 1, startDay.value))
    endDate = new Date(Date.UTC(endYear.value, endMonth.value - 1, endDay.value))
  } else {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    startDate = new Date(currentYear, currentMonth, 1)
    endDate = new Date(currentYear, currentMonth + 1, 0)
  }

  return await eventsStore.getAllActiveScenarioEvents(
    Array.from(activeScenarios.value),
    startDate,
    endDate,
  )
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
        timeout: 2000,
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

async function handleProfileChange(profile) {
  try {
    profileStore.setCurrentProfile(profile)
    await loadProfileData()
  } catch (error) {
    console.error('Error changing profile:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to change profile',
      position: 'top',
    })
  }
}

async function initializeOverview() {
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
    console.error('Error initializing overview:', error)
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
        const start = new Date(startYear.value, startMonth.value - 1, startDay.value)
        start.setHours(0, 0, 0, 0)
        const end = new Date(endYear.value, endMonth.value - 1, endDay.value)
        end.setHours(0, 0, 0, 0)
        await eventsStore.fetchEventsForDateRange(start, end)
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
  await initializeOverview()
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
.overview-page {
  padding: 1rem;
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
  position: relative;
  padding-bottom: 2rem;
}

.overview-container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

// Match spacing below chart to spacing above
.spent-chart-wrapper {
  margin-bottom: 1rem;
}

// Mobile optimization
@media (max-width: 600px) {
  .overview-page {
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
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
    margin-bottom: 0.75rem;
    font-size: 0.95rem;
  }
}

.date-range-filters :deep(.q-select) {
  .q-field__control {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.5);
    border-radius: 12px;
    padding: 0.75rem 1rem;
    min-height: 46px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
  }

  .q-field__control:before,
  .q-field__control:after {
    display: none;
  }

  .q-field__control:hover {
    border-color: rgba(255, 255, 255, 0.7);
    background: rgba(255, 255, 255, 0.12);
  }

  &.q-field--focused .q-field__control {
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }

  .q-field__native,
  .q-field__input {
    color: white;
    font-size: 1rem;
    padding: 0;
    line-height: 1.5;
  }

  .q-field__label {
    color: rgba(255, 255, 255, 0.7);
  }

  .q-field__label--focused {
    color: rgba(102, 126, 234, 0.9);
  }

  .q-icon {
    color: rgba(255, 255, 255, 0.7);
    transition: color 0.2s ease;
  }

  &:hover .q-icon {
    color: rgba(255, 255, 255, 0.9);
  }

  &.q-field--focused .q-icon {
    color: #667eea;
  }
}

/* Date filter dropdown menu styling - Global override for all menus in date filters */
.date-range-filters :deep(.q-select .q-menu),
.date-range-filters :deep(.q-menu),
:deep(.date-range-filters .q-menu) {
  background: rgba(30, 30, 35, 0.98) !important;
  backdrop-filter: blur(12px) !important;
  border: 2px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
  padding: 0.5rem !important;
  max-height: 300px !important;
  overflow-y: auto !important;
  color: white !important;
}

.date-range-filters :deep(.q-select .q-menu .q-item),
.date-range-filters :deep(.q-menu .q-item) {
  color: rgba(255, 255, 255, 0.9) !important;
  background: transparent !important;
  border-radius: 8px !important;
  margin: 2px 0 !important;
  padding: 0.75rem 1rem !important;
  min-height: 44px !important;
  transition: all 0.2s ease !important;

  &:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
  }

  &.q-item--active,
  &.q-item--selected {
    background: rgba(102, 126, 234, 0.2) !important;
    color: #667eea !important;
    font-weight: 600 !important;
  }

  &:active {
    background: rgba(255, 255, 255, 0.15) !important;
    transform: scale(0.98) !important;
  }

  .q-item__label,
  .q-item__section--main {
    color: inherit !important;
    font-size: 1rem !important;
  }
}

// Scrollbar styling for dropdown
.date-range-filters :deep(.q-select .q-menu::-webkit-scrollbar),
.date-range-filters :deep(.q-menu::-webkit-scrollbar) {
  width: 6px !important;
}

.date-range-filters :deep(.q-select .q-menu::-webkit-scrollbar-track),
.date-range-filters :deep(.q-menu::-webkit-scrollbar-track) {
  background: rgba(255, 255, 255, 0.05) !important;
  border-radius: 3px !important;
}

.date-range-filters :deep(.q-select .q-menu::-webkit-scrollbar-thumb),
.date-range-filters :deep(.q-menu::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.2) !important;
  border-radius: 3px !important;

  &:hover {
    background: rgba(255, 255, 255, 0.3) !important;
  }
}

// Mobile optimization for date filters
@media (max-width: 600px) {
  .date-range-filters {
    .text-subtitle2 {
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }

    :deep(.q-select) {
      .q-field__control {
        min-height: 44px;
        padding: 0.625rem 0.875rem;
        border-radius: 10px;
      }

      .q-field__native,
      .q-field__input {
        font-size: 0.9rem;
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
  .overview-page {
    padding: clamp(1.5rem, 2vw, 2.5rem);
  }

  // Match spacing below chart to spacing above on desktop
  .spent-chart-wrapper {
    margin-bottom: clamp(1.5rem, 2vw, 2.5rem);
  }

  // Make container wider on desktop with fluid scaling
  .overview-container {
    max-width: min(90vw, 1600px);
    width: 100%;
  }

  // Make date range filters wider on desktop
  .date-range-filters {
    .row {
      .col-md-6 {
        max-width: 45%;
        flex: 0 0 45%;
      }
    }
  }

  // Make content boxes wider to fill space better with fluid padding
  .glass-card {
    .q-card__section {
      padding: clamp(1.5rem, 2.5vw, 2.5rem) clamp(2rem, 3vw, 3rem);
    }
  }
}

// Large desktop screens (1440px+)
@media (min-width: 1440px) {
  .overview-container {
    max-width: min(92vw, 1800px);
  }

  .glass-card {
    .q-card__section {
      padding: clamp(1.75rem, 2.5vw, 3rem) clamp(2.5rem, 3.5vw, 4rem);
    }
  }
}

// Extra large screens (1920px+)
@media (min-width: 1920px) {
  .overview-container {
    max-width: min(94vw, 2000px);
  }

  .glass-card {
    .q-card__section {
      padding: clamp(2rem, 2.5vw, 3.5rem) clamp(3rem, 4vw, 5rem);
    }
  }
}

@media (max-width: 768px) {
  .overview-page {
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
