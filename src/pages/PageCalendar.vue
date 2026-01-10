<template>
  <q-page class="calendar-page">
    <div class="calendar-container">
      <q-inner-loading :showing="isInitializing" />

      <!-- Calendar View -->
      <div v-if="currentView === 'calendar'" class="calendar-view">
        <q-card class="glass-card">
          <q-card-section>
            <div class="view-header">
              <h2 class="view-title">Calendar</h2>
              <div class="calendar-header-controls">
                <q-btn
                  flat
                  dense
                  round
                  icon="chevron_left"
                  @click="handlePreviousMonth"
                  color="white"
                />
                <h3 class="month-title">{{ currentMonthYear }}</h3>
                <q-btn
                  flat
                  dense
                  round
                  icon="chevron_right"
                  @click="handleNextMonth"
                  color="white"
                />
              </div>
            </div>

            <div class="cash-flow-summary-inline q-mb-lg">
              <div class="cash-flow-item">
                <span class="flow-label">Cash Flow IN</span>
                <span class="flow-amount positive">${{ calendarDaysCreditTotal.toFixed(2) }}</span>
              </div>
              <div class="cash-flow-item">
                <span class="flow-label">Cash Flow OUT</span>
                <span class="flow-amount negative">${{ calendarDaysDebitTotal.toFixed(2) }}</span>
              </div>
              <div class="cash-flow-item">
                <span class="flow-label">Net Flow</span>
                <span class="flow-amount" :class="netFlow >= 0 ? 'positive' : 'negative'">
                  ${{ netFlow.toFixed(2) }}
                </span>
              </div>
            </div>

            <div class="calendar-grid-wrapper">
              <div class="calendar-grid">
                <div v-for="day in daysOfWeek" :key="day" class="calendar-day-header">
                  {{ day }}
                </div>

                <div
                  v-for="date in calendarDays"
                  :key="`${date.date.getTime()}-${date.currentMonth ? 'current' : 'other'}`"
                  class="calendar-day-cell"
                  :class="{
                    'current-month': date.currentMonth,
                    'has-events': date.hasEvents,
                    today: date.isToday,
                    transitioning: isTransitioning,
                  }"
                >
                  <div class="day-number">{{ date.day }}</div>
                  <div v-if="date.events && date.events.length > 0" class="event-details">
                    <div
                      v-for="(event, index) in date.events"
                      :key="index"
                      class="event-item"
                      :class="event.type === 'CREDIT' ? 'positive' : 'negative'"
                      @click="goToAddTransaction(event)"
                    >
                      <div class="event-name">{{ event.name }}</div>
                      <div class="event-amount">${{ getEventDisplayAmount(event) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Scenarios View -->
      <div v-else-if="currentView === 'scenarios'" class="scenarios-view">
        <!-- Background animations -->
        <div class="background-scene">
          <div class="math-equations">
            <div class="equation equation-1">∫ f(x)dx = F(x) + C</div>
            <div class="equation equation-2">e^(iπ) + 1 = 0</div>
            <div class="equation equation-3">∇ × E = -∂B/∂t</div>
            <div class="equation equation-4">∑(n=1→∞) 1/n² = π²/6</div>
          </div>
        </div>

        <div class="scenarios-container">
          <h2 class="scenarios-title">Manage Scenarios</h2>

          <div class="scenarios-content-card glass-card">
            <div class="scenario-section">
              <h3 class="section-title">Active Scenario</h3>
              <p class="section-description">Select a scenario to display on the calendar</p>

              <div class="scenario-list">
                <div
                  v-for="scenario in allScenarios"
                  :key="scenario.id"
                  class="scenario-item"
                  :class="{ active: selectedScenario?.id === scenario.id }"
                  @click="handleScenarioSelection(scenario)"
                >
                  <div class="scenario-item-icon">
                    <q-icon name="layers" size="24px" />
                  </div>
                  <div class="scenario-item-content">
                    <div class="scenario-item-name">{{ scenario.name }}</div>
                    <div v-if="scenario.description" class="scenario-item-description">
                      {{ scenario.description }}
                    </div>
                  </div>
                  <div v-if="selectedScenario?.id === scenario.id" class="scenario-item-check">
                    <q-icon name="check_circle" color="positive" size="24px" />
                  </div>
                </div>
              </div>

              <q-btn
                label="Create New Scenario"
                icon="add"
                class="create-scenario-btn"
                @click="handleCreateScenario"
                unelevated
                no-caps
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Transaction View -->
      <div v-else-if="currentView === 'transaction'" class="transaction-view">
        <!-- Background animations -->
        <div class="background-scene">
          <div class="math-equations">
            <div class="equation equation-1">∫ f(x)dx = F(x) + C</div>
            <div class="equation equation-2">e^(iπ) + 1 = 0</div>
            <div class="equation equation-3">∇ × E = -∂B/∂t</div>
            <div class="equation equation-4">∑(n=1→∞) 1/n² = π²/6</div>
          </div>
        </div>

        <div class="transaction-container">
          <h2 class="transaction-title">Add Transaction</h2>

          <div class="transaction-content-card glass-card">
            <q-form @submit="saveTransaction" class="transaction-form">
              <!-- Category Selection -->
              <div class="form-section">
                <div class="section-header">
                  <q-badge color="primary" label="1" />
                  <span class="section-title">Transaction Category</span>
                </div>

                <q-select
                  v-model="newTransaction.category"
                  :options="categoryOptions"
                  label="Category"
                  outlined
                  dense
                  dark
                  emit-value
                  map-options
                  @update:model-value="handleCategoryChange"
                />
              </div>

              <!-- Transaction Details -->
              <div v-if="newTransaction.category" class="form-section">
                <div class="section-header">
                  <q-badge color="primary" label="2" />
                  <span class="section-title">Transaction Details</span>
                </div>

                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input v-model="newTransaction.name" label="Name" outlined dense required />
                  </div>

                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="newTransaction.description"
                      label="Description"
                      outlined
                      dense
                      required
                    />
                  </div>

                  <div class="col-12 col-md-6">
                    <q-input
                      v-model.number="newTransaction.amount"
                      type="number"
                      :label="isLoanCategory ? 'Total Loan Amount ($)' : 'Amount ($)'"
                      outlined
                      dense
                      required
                      step="0.01"
                    />
                  </div>

                  <!-- Loan-specific fields -->
                  <div v-if="isLoanCategory" class="col-12 col-md-6">
                    <q-input
                      v-model.number="newTransaction.interest"
                      type="number"
                      label="Interest Rate (%)"
                      outlined
                      dense
                      required
                      step="0.001"
                      hint="Annual interest rate"
                    />
                  </div>

                  <div v-if="isLoanCategory" class="col-12 col-md-6">
                    <q-select
                      v-model="newTransaction.loanTerm"
                      :options="loanTermOptions"
                      label="Loan Term"
                      outlined
                      dense
                      dark
                      emit-value
                      map-options
                      :hint="isLoanCategory ? 'Required for loan calculation' : ''"
                    />
                  </div>

                  <div v-if="isLoanCategory" class="col-12 col-md-6">
                    <q-input
                      v-model.number="newTransaction.principal"
                      type="number"
                      label="Additional Principal Payment ($)"
                      outlined
                      dense
                      step="0.01"
                      hint="Optional extra monthly payment"
                    />
                  </div>

                  <div v-if="isMortgageCategory" class="col-12 col-md-6">
                    <q-input
                      v-model.number="newTransaction.escrow"
                      type="number"
                      label="Escrow ($)"
                      outlined
                      dense
                      step="0.01"
                      hint="Monthly escrow amount (taxes, insurance, etc.)"
                    />
                  </div>

                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="newTransaction.frequency"
                      :options="frequencyOptions"
                      label="Frequency"
                      outlined
                      dense
                      dark
                      emit-value
                      map-options
                    />
                  </div>

                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="newTransaction.type"
                      :options="typeOptions"
                      label="Type"
                      outlined
                      dense
                      dark
                      emit-value
                      map-options
                    />
                  </div>

                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="newTransaction.scenarioID"
                      :options="scenarioOptionsForTransaction"
                      label="Scenario"
                      outlined
                      dense
                      dark
                      emit-value
                      map-options
                    />
                  </div>

                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="newTransaction.startDate"
                      type="date"
                      label="Start Date"
                      outlined
                      dense
                      required
                    />
                  </div>

                  <!-- End Date - hidden for loans, shown for regular transactions -->
                  <div v-if="!isLoanCategory" class="col-12 col-md-6">
                    <q-input
                      v-model="newTransaction.endDate"
                      type="date"
                      label="End Date"
                      outlined
                      dense
                      required
                    />
                  </div>

                  <!-- For loans, show calculated end date as read-only info -->
                  <div v-if="isLoanCategory && loanCalculationPreview" class="col-12 col-md-6">
                    <q-input
                      :model-value="newTransaction.endDate"
                      type="text"
                      label="End Date (Calculated)"
                      outlined
                      dense
                      readonly
                      hint="Automatically calculated from loan term"
                    />
                  </div>
                </div>
              </div>

              <!-- Loan Calculation Preview -->
              <div
                v-if="isLoanCategory && loanCalculationPreview"
                class="loan-preview-card q-mt-lg"
              >
                <h4 class="loan-preview-title">Loan Calculation Details</h4>
                <div class="loan-preview-grid">
                  <div class="loan-preview-item">
                    <span class="loan-preview-label">Standard Payment:</span>
                    <span class="loan-preview-value">{{
                      currencyFormat(loanCalculationPreview.standardPayment || 0).replace(
                        /^[+-]\s/,
                        '',
                      )
                    }}</span>
                  </div>
                  <div v-if="isMortgageCategory" class="loan-preview-item highlight">
                    <span class="loan-preview-label">Total Monthly Payment:</span>
                    <span class="loan-preview-value">{{
                      currencyFormat(
                        (loanCalculationPreview.monthlyPayment || 0) +
                          (parseFloat(newTransaction.escrow) || 0),
                      ).replace(/^[+-]\s/, '')
                    }}</span>
                  </div>
                  <div v-else class="loan-preview-item highlight">
                    <span class="loan-preview-label">Total Monthly Payment:</span>
                    <span class="loan-preview-value">{{
                      currencyFormat(
                        (loanCalculationPreview.standardPayment || 0) +
                          (loanCalculationPreview.additionalPrincipal || 0),
                      ).replace(/^[+-]\s/, '')
                    }}</span>
                  </div>
                  <div class="loan-preview-item">
                    <span class="loan-preview-label">Additional Principal:</span>
                    <span class="loan-preview-value">{{
                      currencyFormat(loanCalculationPreview.additionalPrincipal || 0).replace(
                        /^[+-]\s/,
                        '',
                      )
                    }}</span>
                  </div>
                  <div v-if="isMortgageCategory" class="loan-preview-item">
                    <span class="loan-preview-label">Escrow Payment:</span>
                    <span class="loan-preview-value">{{
                      currencyFormat(parseFloat(newTransaction.escrow) || 0).replace(/^[+-]\s/, '')
                    }}</span>
                  </div>
                  <div class="loan-preview-item">
                    <span class="loan-preview-label">Loan Term:</span>
                    <span class="loan-preview-value"
                      >{{ loanCalculationPreview.totalPayments }} months</span
                    >
                  </div>
                  <div class="loan-preview-item">
                    <span class="loan-preview-label">End Date:</span>
                    <span class="loan-preview-value">{{
                      formatLoanDate(loanCalculationPreview.endDate)
                    }}</span>
                  </div>
                  <div class="loan-preview-item">
                    <span class="loan-preview-label">Total Interest:</span>
                    <span class="loan-preview-value">{{
                      currencyFormat(loanCalculationPreview.totalInterest || 0).replace(
                        /^[+-]\s/,
                        '',
                      )
                    }}</span>
                  </div>
                  <div class="loan-preview-item">
                    <span class="loan-preview-label">Total Paid Over Term:</span>
                    <span class="loan-preview-value">{{
                      currencyFormat(
                        loanCalculationPreview.monthlyPayment *
                          loanCalculationPreview.totalPayments,
                      ).replace(/^[+-]\s/, '')
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="form-actions q-mt-lg">
                <q-btn
                  type="submit"
                  label="Save Transaction"
                  color="primary"
                  :loading="isSavingTransaction"
                  unelevated
                  no-caps
                  class="save-transaction-btn"
                />
              </div>
            </q-form>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { currencyFormat } from '../js/utils'
import { useCalendarStore } from '../stores/calendar'
import { useScenariosStore } from '../stores/scenarios'
import { useEventsStore } from '../stores/events'
import { useConstantsStore } from '../stores/constants'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const calendarStore = useCalendarStore()
const scenariosStore = useScenariosStore()
const eventsStore = useEventsStore()
const constantsStore = useConstantsStore()

const daysOfWeek = computed(() => constantsStore.getDaysOfWeek)
const isTransitioning = ref(false)
const isInitializing = ref(false)
const isSavingTransaction = ref(false)
const loanCalculationPreview = ref(null)
const loanCalculationTimeout = ref(null)

// Transaction form state
const newTransaction = ref({
  name: '',
  description: '',
  amount: null,
  category: '',
  frequency: 'MONTHLY',
  type: 'DEBIT',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  scenarioID: '',
  profileID: '',
  interest: null,
  principal: null,
  loanTerm: '',
  escrow: null,
})

const categoryOptions = computed(() => constantsStore.getCategoryOptions)
const frequencyOptions = computed(() => constantsStore.getFrequencyOptions)
const typeOptions = computed(() => constantsStore.getTypeOptions)
const loanTermOptions = computed(() => constantsStore.getLoanTermOptions)

// Determine current view from query parameter
const currentView = computed(() => {
  return route.query.view || 'calendar'
})

const netFlow = computed(() => calendarStore.netFlow)
const currentMonthYear = computed(() => calendarStore.currentMonthYear)
const profile = computed(() => calendarStore.profile)
const calendarDays = computed(() => calendarStore.calendarDays)
const calendarDaysDebitTotal = computed(() => calendarStore.calendarDaysDebitTotal)
const calendarDaysCreditTotal = computed(() => calendarStore.calendarDaysCreditTotal)

const allScenarios = computed(() => scenariosStore.allScenarios)
const selectedScenario = computed(() => scenariosStore.selectedScenario)
const hasScenarios = computed(() => scenariosStore.hasScenarios)

const monthlyEvents = computed(() => eventsStore.monthlyEvents)

const scenarioOptionsForTransaction = computed(() => {
  return allScenarios.value.map((s) => ({
    label: s.name,
    value: s.id,
  }))
})

const isLoanCategory = computed(() => {
  const loanCategories = ['MORTGAGE', 'AUTO_LOAN', 'GENERIC_LOAN']
  return loanCategories.includes(newTransaction.value.category)
})

const isMortgageCategory = computed(() => {
  return newTransaction.value.category === 'MORTGAGE'
})

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

function goToAddTransaction(event) {
  const query = {
    eventID: event && event.id ? event.id : undefined,
    profileID: profile.value.id,
    scenarioID: selectedScenario.value.id,
  }

  router.push({
    path: '/transaction',
    query: query,
  })
}

async function handlePreviousMonth() {
  isTransitioning.value = true
  await calendarStore.previousMonth()
  setTimeout(() => {
    isTransitioning.value = false
  }, 300)
}

async function handleNextMonth() {
  isTransitioning.value = true
  await calendarStore.nextMonth()
  setTimeout(() => {
    isTransitioning.value = false
  }, 300)
}

function goToCreateScenarioPage() {
  router.push({
    path: '/create-scenario',
    query: { profileID: profile.value?.id },
  })
}

function handleScenarioSelection(scenario) {
  scenariosStore.selectScenario(scenario)
}

function handleCreateScenario() {
  goToCreateScenarioPage()
}

function handleCategoryChange(value) {
  const incomeCategories = ['PRIMARY_INCOME', 'SECONDARY_INCOME', 'MISC']
  if (incomeCategories.includes(value)) {
    newTransaction.value.type = 'CREDIT'
  } else {
    newTransaction.value.type = 'DEBIT'
  }

  // Trigger loan calculation if switching to/from loan category
  if (isLoanCategory.value) {
    debouncedCalculateLoan()
  } else {
    loanCalculationPreview.value = null
  }
}

function calculateEndDateFromTerm() {
  if (!isLoanCategory.value || !newTransaction.value.startDate || !newTransaction.value.loanTerm) {
    return
  }

  const startDate = new Date(newTransaction.value.startDate)
  const termInMonths = parseInt(newTransaction.value.loanTerm)

  if (!isNaN(startDate.getTime()) && termInMonths > 0) {
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + termInMonths)
    newTransaction.value.endDate = endDate.toISOString().split('T')[0]
  }
}

function debouncedCalculateLoan() {
  // Only calculate simple end date if we don't have all required fields for API calculation
  const hasAllFields =
    newTransaction.value.amount &&
    newTransaction.value.interest &&
    newTransaction.value.loanTerm &&
    newTransaction.value.startDate

  if (!hasAllFields && newTransaction.value.startDate && newTransaction.value.loanTerm) {
    // Fallback: simple calculation from term only (without principal payment consideration)
    calculateEndDateFromTerm()
  }

  // Clear existing timeout
  if (loanCalculationTimeout.value) {
    clearTimeout(loanCalculationTimeout.value)
  }

  // Set new timeout for 500ms delay - API will calculate correct end date with principal payment
  loanCalculationTimeout.value = setTimeout(() => {
    calculateLoanDetails()
  }, 500)
}

async function calculateLoanDetails() {
  if (!isLoanCategory.value) {
    loanCalculationPreview.value = null
    return
  }

  const totalLoanAmount = parseFloat(newTransaction.value.amount) || 0
  const additionalPrincipalPayment = parseFloat(newTransaction.value.principal) || 0
  const interestRate = parseFloat(newTransaction.value.interest) || 0
  const startDate = newTransaction.value.startDate
  const loanTerm = newTransaction.value.loanTerm

  // Validate required fields
  if (!totalLoanAmount || !interestRate || !startDate || !loanTerm) {
    loanCalculationPreview.value = null
    return
  }

  try {
    const loanData = {
      totalLoanAmount,
      additionalPrincipalPayment,
      interestRate,
      startDate: startDate.split('T')[0],
      loanTerm: parseInt(loanTerm),
    }

    const response = await eventsStore.calculateLoanDetails(loanData)

    if (response) {
      loanCalculationPreview.value = response

      // Auto-update the end date
      if (response.endDate) {
        newTransaction.value.endDate = new Date(response.endDate).toISOString().split('T')[0]
      }
    }
  } catch (error) {
    console.error('Error calculating loan:', error)
    loanCalculationPreview.value = null
  }
}

function formatLoanDate(dateString) {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return 'Invalid Date'
  }
}

async function saveTransaction() {
  isSavingTransaction.value = true
  try {
    // Format dates
    const formattedStartDate = newTransaction.value.startDate.split('T')[0]
    const formattedEndDate = newTransaction.value.endDate.split('T')[0]

    // Build event data matching the original app's format
    const eventData = {
      name: newTransaction.value.name,
      description: newTransaction.value.description,
      amount: parseFloat(newTransaction.value.amount),
      category: newTransaction.value.category,
      frequency: newTransaction.value.frequency,
      type: newTransaction.value.type,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      calculatedEndDate: formattedEndDate, // Always set calculatedEndDate (defaults to endDate)
      scenarioID: newTransaction.value.scenarioID || selectedScenario.value.id,
      profileID: profile.value.id,
      active: true,
    }

    // Add loan-specific fields if applicable (matching original app format)
    if (isLoanCategory.value) {
      eventData.principal = newTransaction.value.principal
        ? parseFloat(newTransaction.value.principal)
        : null
      eventData.interest = newTransaction.value.interest
        ? parseFloat(newTransaction.value.interest)
        : null
      eventData.loanTerm = newTransaction.value.loanTerm
        ? parseInt(newTransaction.value.loanTerm)
        : null

      // Add calculated monthly payment from loan calculation
      if (loanCalculationPreview.value) {
        eventData.monthlyPayment = parseFloat(loanCalculationPreview.value.monthlyPayment)
        eventData.calculatedEndDate = new Date(loanCalculationPreview.value.endDate)
          .toISOString()
          .split('T')[0]
      } else {
        // Fallback: use calculated end date from term
        eventData.calculatedEndDate = formattedEndDate
      }

      // Add escrow for mortgages
      if (isMortgageCategory.value && newTransaction.value.escrow) {
        eventData.escrow = parseFloat(newTransaction.value.escrow)
      } else {
        eventData.escrow = null
      }
    }

    await eventsStore.createEvent(eventData)

    // Show success notification
    $q.notify({
      type: 'positive',
      message: 'Transaction created successfully',
      position: 'top',
    })

    // Reset form
    newTransaction.value = {
      name: '',
      description: '',
      amount: null,
      category: '',
      frequency: 'MONTHLY',
      type: 'DEBIT',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      scenarioID: '',
      profileID: '',
      interest: null,
      principal: null,
      loanTerm: '',
      escrow: null,
    }

    // Reset loan calculation preview
    loanCalculationPreview.value = null

    // Refresh calendar data
    await eventsStore.fetchEventsForMonthByScenario()
    calendarStore.updateCalendarDays()
  } catch (error) {
    console.error('Error saving transaction:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to save transaction',
      position: 'top',
    })
  } finally {
    isSavingTransaction.value = false
  }
}

async function initializeCalendar() {
  if (isInitializing.value) return
  isInitializing.value = true

  try {
    if (!profile.value || !selectedScenario.value) {
      const profileID = router.currentRoute.value.query.profileID || localStorage.getItem('userID')
      if (profileID) {
        await calendarStore.fetchProfileInfo(profileID)

        if (!hasScenarios.value) {
          await scenariosStore.fetchScenarios()
        }

        const routeScenarioID = router.currentRoute.value.query.scenarioID
        if (routeScenarioID && hasScenarios.value) {
          const targetScenario = allScenarios.value.find((s) => s.id === routeScenarioID)
          if (targetScenario) {
            await scenariosStore.selectScenario(targetScenario)
          } else {
            await scenariosStore.selectDefaultScenario()
          }
        } else if (!selectedScenario.value && hasScenarios.value) {
          await scenariosStore.selectDefaultScenario()
        }

        if (selectedScenario.value) {
          await eventsStore.fetchEventsForMonthByScenario()
          calendarStore.updateCalendarDays()
        } else {
          console.error('No scenario selected, cannot fetch events')
        }
      }
    } else {
      const routeScenarioID = router.currentRoute.value.query.scenarioID
      if (routeScenarioID && routeScenarioID !== selectedScenario.value.id) {
        const targetScenario = allScenarios.value.find((s) => s.id === routeScenarioID)
        if (targetScenario) {
          await scenariosStore.selectScenario(targetScenario)
          await eventsStore.fetchEventsForMonthByScenario()
          calendarStore.updateCalendarDays()
        }
      } else {
        await eventsStore.fetchEventsForMonthByScenario()
        calendarStore.updateCalendarDays()
      }
    }

    console.log('=== CALENDAR PAGE LOADED ===')
    console.log('Active Scenario:', selectedScenario.value?.name || 'None')
    console.log('Events loaded for scenario:', monthlyEvents.value || [])
    console.log('=== END CALENDAR PAGE LOADED ===')
  } finally {
    isInitializing.value = false
  }
}

onMounted(async () => {
  await initializeCalendar()
})

watch(
  selectedScenario,
  async (newVal, oldVal) => {
    if (newVal && newVal.id && oldVal && newVal.id !== oldVal.id) {
      await eventsStore.fetchEventsForMonthByScenario()
      calendarStore.updateCalendarDays()
      console.log('=== SCENARIO CHANGED ===')
      console.log('New Active Scenario:', newVal.name || 'None')
      console.log('Events loaded for scenario:', monthlyEvents.value || [])
      console.log('=== END SCENARIO CHANGED ===')
    }
  },
  { immediate: false },
)

watch(
  monthlyEvents,
  (newVal, oldVal) => {
    if (newVal && Array.isArray(newVal) && newVal.length > 0) {
      if (!oldVal || JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
        calendarStore.updateCalendarDays()
      }
    }
  },
  { immediate: false },
)

// Initialize transaction form with current profile and scenario when switching to transaction view
watch(currentView, (newView) => {
  if (newView === 'transaction' && profile.value && selectedScenario.value) {
    newTransaction.value.profileID = profile.value.id
    newTransaction.value.scenarioID = selectedScenario.value.id
  }
})

// Watch loan-related fields to trigger calculation
watch(
  () => newTransaction.value.amount,
  () => {
    if (
      isLoanCategory.value &&
      newTransaction.value.amount &&
      newTransaction.value.interest &&
      newTransaction.value.loanTerm
    ) {
      debouncedCalculateLoan()
    }
  },
)

watch(
  () => newTransaction.value.interest,
  () => {
    if (
      isLoanCategory.value &&
      newTransaction.value.amount &&
      newTransaction.value.interest &&
      newTransaction.value.loanTerm
    ) {
      debouncedCalculateLoan()
    }
  },
)

watch(
  () => newTransaction.value.principal,
  () => {
    if (
      isLoanCategory.value &&
      newTransaction.value.amount &&
      newTransaction.value.interest &&
      newTransaction.value.loanTerm
    ) {
      debouncedCalculateLoan()
    }
  },
)

watch(
  () => newTransaction.value.loanTerm,
  () => {
    // Only use simple calculation if we don't have all fields for API calculation
    const hasAllFields =
      newTransaction.value.amount &&
      newTransaction.value.interest &&
      newTransaction.value.loanTerm &&
      newTransaction.value.startDate

    if (
      !hasAllFields &&
      isLoanCategory.value &&
      newTransaction.value.startDate &&
      newTransaction.value.loanTerm
    ) {
      calculateEndDateFromTerm()
    }

    // Trigger full loan calculation (API will calculate correct end date with principal payment)
    if (
      isLoanCategory.value &&
      newTransaction.value.amount &&
      newTransaction.value.interest &&
      newTransaction.value.loanTerm
    ) {
      debouncedCalculateLoan()
    }
  },
)

watch(
  () => newTransaction.value.startDate,
  () => {
    // Only use simple calculation if we don't have all fields for API calculation
    const hasAllFields =
      newTransaction.value.amount &&
      newTransaction.value.interest &&
      newTransaction.value.loanTerm &&
      newTransaction.value.startDate

    if (
      !hasAllFields &&
      isLoanCategory.value &&
      newTransaction.value.startDate &&
      newTransaction.value.loanTerm
    ) {
      calculateEndDateFromTerm()
    }

    // Trigger full loan calculation (API will calculate correct end date with principal payment)
    if (
      isLoanCategory.value &&
      newTransaction.value.amount &&
      newTransaction.value.interest &&
      newTransaction.value.loanTerm
    ) {
      debouncedCalculateLoan()
    }
  },
)
</script>

<style scoped lang="scss">
.calendar-page {
  padding: 1rem;
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
}

.calendar-container {
  max-width: 1400px;
  margin: 0 auto;
}

.view-header {
  margin-bottom: 1.5rem;
}

.view-title {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 1rem 0;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 0.5rem;
}

.section-description {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 1rem;
}

// Calendar View Styles
.calendar-view {
  .calendar-header-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-top: 1rem;
  }

  .month-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    min-width: 200px;
    text-align: center;
  }
}

.cash-flow-summary-inline {
  display: flex;
  justify-content: space-around;
  gap: 1rem;
  padding: 1rem;
  background: rgba(168, 85, 247, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.cash-flow-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.flow-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.flow-amount {
  font-size: 1.3rem;
  font-weight: 700;

  &.positive {
    color: #4caf50;
  }

  &.negative {
    color: #ef4444;
  }
}

// Scenarios View Styles
.scenarios-view {
  padding: 0;
  position: relative;
  min-height: 100vh;
}

.background-scene {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  overflow: hidden;
}

.math-equations {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.equation {
  position: absolute;
  font-family: 'Times New Roman', serif;
  font-size: 1.2rem;
  font-weight: 300;
  background: linear-gradient(
    135deg,
    #667eea 0%,
    #764ba2 25%,
    #f093fb 50%,
    #f5576c 75%,
    #4facfe 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0;
  transform: scale(0.8);
  white-space: nowrap;
  text-shadow:
    0 0 30px rgba(102, 126, 234, 0.6),
    0 0 40px rgba(118, 75, 162, 0.4),
    0 0 50px rgba(240, 147, 251, 0.3);
}

.equation-1 {
  top: 15%;
  left: 10%;
  animation: equationFade 8s ease-in-out infinite 0s;
}

.equation-2 {
  top: 25%;
  right: 15%;
  animation: equationFade 8s ease-in-out infinite 1s;
}

.equation-3 {
  top: 65%;
  left: 15%;
  animation: equationFade 8s ease-in-out infinite 2s;
}

.equation-4 {
  top: 85%;
  right: 15%;
  animation: equationFade 8s ease-in-out infinite 3s;
}

@keyframes equationFade {
  0% {
    opacity: 0;
    transform: scale(0.8) rotate(-2deg);
  }
  25% {
    opacity: 0.4;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1) rotate(1deg);
  }
  75% {
    opacity: 0.4;
    transform: scale(1) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: scale(0.8) rotate(-2deg);
  }
}

.scenarios-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 1rem;
  position: relative;
  z-index: 2;
}

.scenarios-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 1.5rem 0 2rem 0;
  text-align: center;
  letter-spacing: -0.5px;
}

.scenarios-content-card {
  padding: 2rem;
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(168, 85, 247, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.scenario-section {
  .section-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: white;
    margin: 0 0 0.5rem 0;
  }

  .section-description {
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 1.5rem;
  }
}

.scenario-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.scenario-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(168, 85, 247, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(168, 85, 247, 0.15);
    border-color: rgba(168, 85, 247, 0.5);
    transform: translateY(-2px);
  }

  &.active {
    background: rgba(168, 85, 247, 0.25);
    border-color: rgba(168, 85, 247, 0.6);
    box-shadow: 0 4px 16px rgba(168, 85, 247, 0.3);
  }
}

.scenario-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a855f7;
}

.scenario-item-content {
  flex: 1;
}

.scenario-item-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.25rem;
}

.scenario-item-description {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
}

.scenario-item-check {
  display: flex;
  align-items: center;
}

.create-scenario-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #9333ea 0%, #6d28d9 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(168, 85, 247, 0.4);
  }
}

// Transaction View Styles
.transaction-view {
  padding: 0;
  position: relative;
  min-height: 100vh;
}

.transaction-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 1rem;
  position: relative;
  z-index: 2;
}

.transaction-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 1.5rem 0 2rem 0;
  text-align: center;
  letter-spacing: -0.5px;
}

.transaction-content-card {
  padding: 3rem 2rem;
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(168, 85, 247, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  text-align: center;
}

.transaction-section {
  .section-description {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.7);
    margin: 0 0 2rem;
    line-height: 1.6;
  }
}

.transaction-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-section {
  padding: 1.5rem 0;
  border-bottom: 1px solid rgba(168, 85, 247, 0.2);

  &:last-of-type {
    border-bottom: none;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;

  :deep(.q-badge) {
    background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.5rem 0.75rem;
  }
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 2rem;
  border-top: 1px solid rgba(168, 85, 247, 0.2);
}

.save-transaction-btn {
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #9333ea 0%, #6d28d9 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(168, 85, 247, 0.4);
  }
}

// Loan Calculation Preview
.loan-preview-card {
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1.5rem;
}

.loan-preview-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  margin: 0 0 1rem 0;
  text-align: center;
}

.loan-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.loan-preview-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;

  &.highlight {
    background: rgba(168, 85, 247, 0.2);
    border: 1px solid rgba(168, 85, 247, 0.4);
  }
}

.loan-preview-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.loan-preview-value {
  font-size: 0.95rem;
  color: white;
  font-weight: 600;

  .highlight & {
    color: #4caf50;
    font-size: 1.05rem;
  }
}

// Input styling for transaction form
.transaction-content-card {
  :deep(.q-field) {
    .q-field__control {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(168, 85, 247, 0.3);
      border-radius: 8px;
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(168, 85, 247, 0.5);
      }
    }

    .q-field__label {
      color: rgba(255, 255, 255, 0.7);
    }

    .q-field__native {
      color: white;
    }

    .q-field__append {
      color: rgba(255, 255, 255, 0.7);
    }

    .q-field__messages {
      color: rgba(255, 255, 255, 0.7) !important;
    }

    .q-field__hint {
      color: rgba(255, 255, 255, 0.6) !important;
    }

    &.q-field--focused {
      .q-field__control {
        border-color: #a855f7;
        box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2);
      }

      .q-field__label {
        color: #a855f7;
      }
    }
  }

  // Make calendar icons white for date inputs
  :deep(input[type='date']) {
    &::-webkit-calendar-picker-indicator {
      filter: invert(1) brightness(1.5) !important;
      cursor: pointer !important;
      opacity: 1 !important;
      background-color: transparent !important;
    }

    &::-moz-calendar-picker-indicator {
      filter: invert(1) brightness(1.5) !important;
    }
  }
}

// Additional calendar icon styling at component level
.transaction-view {
  :deep(input[type='date']::-webkit-calendar-picker-indicator) {
    filter: invert(1) brightness(2) !important;
    cursor: pointer !important;
  }
}

.calendar-grid-wrapper {
  overflow-x: auto;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  min-width: 700px;
}

.calendar-day-header {
  text-align: center;
  padding: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}

.calendar-day-cell {
  min-height: 100px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.has-events {
    background: rgba(33, 150, 243, 0.15);
    border: 1px solid rgba(33, 150, 243, 0.3);
  }

  &.today {
    background: rgba(76, 175, 80, 0.2);
    border: 2px solid #4caf50;
  }

  &:not(.current-month) {
    opacity: 0.4;
  }

  &.transitioning {
    opacity: 0.6;
  }
}

.day-number {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.event-item {
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 0.75rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }

  &.positive {
    border-left: 3px solid #4caf50;
  }

  &.negative {
    border-left: 3px solid #f44336;
  }
}

.event-name {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-amount {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

@media (max-width: 768px) {
  .calendar-page {
    padding: 0.5rem;
  }

  .view-title {
    font-size: 1.5rem;
  }

  .scenarios-title {
    font-size: 2rem;
    margin: 1rem 0 1.5rem 0;
  }

  .scenarios-content-card {
    padding: 1.5rem;
  }

  .calendar-day-cell {
    min-height: 80px;
  }

  .calendar-header-controls {
    .month-title {
      font-size: 1.2rem;
      min-width: 150px;
    }
  }

  .cash-flow-summary-inline {
    flex-direction: column;
  }

  .scenario-item {
    padding: 0.875rem;
  }

  .scenario-item-name {
    font-size: 1rem;
  }

  .transaction-title {
    font-size: 2rem;
    margin: 1rem 0 1.5rem 0;
  }

  .transaction-content-card {
    padding: 2rem 1.5rem;
  }

  .save-transaction-btn {
    width: 100%;
    font-size: 1rem;
  }

  .form-section {
    padding: 1.25rem 0;
  }

  .section-title {
    font-size: 1.1rem;
  }
}
</style>
