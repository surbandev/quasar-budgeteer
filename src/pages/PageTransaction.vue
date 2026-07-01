<template>
  <q-page class="transaction-page">
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
      <h1 class="form-title">
        {{ currentEvent ? 'Edit Transaction' : 'Add Transaction' }}
      </h1>

      <q-inner-loading :showing="isLoadingEvent" />

      <q-card v-if="!isLoadingEvent" class="transaction-card glass-card">
        <q-card-section>
          <q-form @submit="saveEvent" class="q-gutter-md">
            <!-- Category Selection -->
            <div class="form-section">
              <div class="section-header">
                <q-badge color="primary" label="1" />
                <span class="section-title">Transaction Category</span>
              </div>

              <q-select
                v-model="newEvent.category"
                :options="categoryOptions"
                label="Category"
                outlined
                dense
                emit-value
                map-options
                @update:model-value="handleCategoryChange"
              />
            </div>

            <!-- Transaction Details -->
            <div v-if="newEvent.category" class="form-section">
              <div class="section-header">
                <q-badge color="primary" label="2" />
                <span class="section-title">Transaction Details</span>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input v-model="newEvent.name" label="Name" outlined dense required />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    v-model="newEvent.description"
                    label="Description"
                    outlined
                    dense
                    required
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    v-model.number="newEvent.amount"
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
                    v-model.number="newEvent.interest"
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
                    v-model="newEvent.loanTerm"
                    :options="loanTermOptions"
                    label="Loan Term"
                    outlined
                    dense
                    emit-value
                    map-options
                    hint="Required for loan calculation"
                  />
                </div>

                <div v-if="isLoanCategory" class="col-12 col-md-6">
                  <q-input
                    v-model.number="newEvent.principal"
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
                    v-model.number="newEvent.escrow"
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
                    v-model="newEvent.frequency"
                    :options="frequencyOptions"
                    label="Frequency"
                    outlined
                    dense
                    emit-value
                    map-options
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-select
                    v-model="newEvent.type"
                    :options="typeOptions"
                    label="Type"
                    outlined
                    dense
                    emit-value
                    map-options
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-select
                    v-model="newEvent.scenarioID"
                    :options="scenarioOptions"
                    label="Scenario"
                    outlined
                    dense
                    emit-value
                    map-options
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    v-model="newEvent.startDate"
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
                    v-model="newEvent.endDate"
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
                    :model-value="newEvent.endDate"
                    type="text"
                    label="End Date (Calculated)"
                    outlined
                    dense
                    readonly
                    hint="Automatically calculated from loan term"
                  />
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
                    <span class="loan-preview-value">{{ formatLoanCurrency(loanCalculationPreview.standardPayment || 0) }}</span>
                  </div>
                  <div v-if="isMortgageCategory" class="loan-preview-item highlight">
                    <span class="loan-preview-label">Total Monthly Payment:</span>
                    <span class="loan-preview-value">{{
                      formatLoanCurrency(
                        (loanCalculationPreview.monthlyPayment || 0) +
                          (parseFloat(newEvent.escrow) || 0),
                      )
                    }}</span>
                  </div>
                  <div v-else class="loan-preview-item highlight">
                    <span class="loan-preview-label">Total Monthly Payment:</span>
                    <span class="loan-preview-value">{{
                      formatLoanCurrency(
                        (loanCalculationPreview.standardPayment || 0) +
                          (loanCalculationPreview.additionalPrincipal || 0),
                      )
                    }}</span>
                  </div>
                  <div class="loan-preview-item">
                    <span class="loan-preview-label">Additional Principal:</span>
                    <span class="loan-preview-value">{{
                      formatLoanCurrency(loanCalculationPreview.additionalPrincipal || 0)
                    }}</span>
                  </div>
                  <div v-if="isMortgageCategory" class="loan-preview-item">
                    <span class="loan-preview-label">Escrow:</span>
                    <span class="loan-preview-value">{{
                      formatLoanCurrency(parseFloat(newEvent.escrow) || 0)
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
                      formatLoanCurrency(loanCalculationPreview.totalInterest || 0)
                    }}</span>
                  </div>
                  <div class="loan-preview-item">
                    <span class="loan-preview-label">Total Paid Over Term:</span>
                    <span class="loan-preview-value">{{
                      formatLoanCurrency(
                        loanCalculationPreview.monthlyPayment *
                          loanCalculationPreview.totalPayments,
                      )
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="form-actions q-mt-lg">
              <q-btn
                v-if="currentEvent"
                label="Delete"
                color="negative"
                @click="removeEvent"
                no-caps
                unelevated
              />
              <q-btn
                type="submit"
                :label="currentEvent ? 'Update' : 'Save'"
                color="primary"
                :loading="isSaving"
                no-caps
                unelevated
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useScenariosStore } from '../stores/scenarios'
import { useEventsStore } from '../stores/events'
import { useOverviewStore } from '../stores/overview'
import { useProfileStore } from '../stores/profile'
import { useConstantsStore } from '../stores/constants'
import { useCalendarStore } from '../stores/calendar'
import { showSuccessCheckmark } from '../js/utils'
import { toDateInputValue } from '../js/dates'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const scenariosStore = useScenariosStore()
const eventsStore = useEventsStore()
const overviewStore = useOverviewStore()
const profileStore = useProfileStore()
const constantsStore = useConstantsStore()
const calendarStore = useCalendarStore()

const isLoadingEvent = ref(false)
const isSaving = ref(false)
const currentEvent = ref(null)
const loanCalculationPreview = ref(null)
const loanCalculationTimeout = ref(null)

const newEvent = ref({
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
  monthlyAmount: null,
  active: true,
})

const categoryOptions = computed(() => constantsStore.getCategoryOptions)
const frequencyOptions = computed(() => constantsStore.getFrequencyOptions)
const typeOptions = computed(() => constantsStore.getTypeOptions)
const loanTermOptions = computed(() => constantsStore.getLoanTermOptions)

const scenarioOptions = computed(() => {
  return scenariosStore.allScenarios.map((s) => ({
    label: s.name,
    value: s.id,
  }))
})

const isLoanCategory = computed(() => {
  return constantsStore.isLoanCategory(newEvent.value.category)
})

const isMortgageCategory = computed(() => {
  return newEvent.value.category === 'MORTGAGE'
})

function handleCategoryChange(value) {
  const incomeCategories = ['PRIMARY_INCOME', 'SECONDARY_INCOME', 'MISC']
  if (incomeCategories.includes(value)) {
    newEvent.value.type = 'CREDIT'
  } else {
    newEvent.value.type = 'DEBIT'
  }

  if (constantsStore.isLoanCategory(value)) {
    debouncedCalculateLoan()
  } else {
    loanCalculationPreview.value = null
  }
}

function debouncedCalculateLoan() {
  const hasAllFields =
    newEvent.value.amount &&
    newEvent.value.interest &&
    newEvent.value.loanTerm &&
    newEvent.value.startDate

  if (!hasAllFields && newEvent.value.startDate && newEvent.value.loanTerm) {
    calculateEndDateFromTerm()
  }

  if (loanCalculationTimeout.value) {
    clearTimeout(loanCalculationTimeout.value)
  }

  loanCalculationTimeout.value = setTimeout(() => {
    calculateLoanDetails()
  }, 500)
}

async function calculateLoanDetails() {
  if (!isLoanCategory.value) {
    loanCalculationPreview.value = null
    return
  }

  const totalLoanAmount = parseFloat(newEvent.value.amount) || 0
  const additionalPrincipalPayment = parseFloat(newEvent.value.principal) || 0
  const interestRate = parseFloat(newEvent.value.interest) || 0
  const startDate = newEvent.value.startDate
  const loanTerm = newEvent.value.loanTerm

  if (!totalLoanAmount || !interestRate || !startDate || !loanTerm) {
    loanCalculationPreview.value = null
    return
  }

  try {
    const response = await eventsStore.calculateLoanDetails({
      totalLoanAmount,
      additionalPrincipalPayment,
      interestRate,
      startDate: String(startDate).split('T')[0],
      loanTerm: parseInt(loanTerm, 10),
    })

    if (response) {
      loanCalculationPreview.value = {
        ...response,
        monthlyPayment: roundToCents(response.monthlyPayment),
      }

      if (response.endDate) {
        newEvent.value.endDate = new Date(response.endDate).toISOString().split('T')[0]
      }
    }
  } catch (error) {
    console.error('Error calculating loan:', error)
    loanCalculationPreview.value = null
  }
}

function roundToCents(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return 0
  return Math.round((numericValue + Number.EPSILON) * 100) / 100
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

function formatLoanCurrency(amount) {
  const numericValue = Number(amount) || 0
  return `$${Math.abs(numericValue).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function resolvedMonthlyPayment() {
  if (loanCalculationPreview.value?.monthlyPayment != null) {
    return roundToCents(loanCalculationPreview.value.monthlyPayment)
  }
  if (newEvent.value.monthlyAmount) {
    return roundToCents(newEvent.value.monthlyAmount)
  }
  return 0
}

function calculateEndDateFromTerm() {
  if (!isLoanCategory.value || !newEvent.value.startDate || !newEvent.value.loanTerm) {
    return
  }

  const startDate = new Date(newEvent.value.startDate)
  const termInMonths = parseInt(newEvent.value.loanTerm)

  if (!isNaN(startDate.getTime()) && termInMonths > 0) {
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + termInMonths)
    newEvent.value.endDate = endDate.toISOString().split('T')[0]
  }
}

function loadCurrentEventData() {
  // If we have a currentEvent loaded, populate newEvent with its data
  if (currentEvent.value) {
    newEvent.value = {
      name: currentEvent.value.name || '',
      description: currentEvent.value.description || '',
      type: currentEvent.value.type || 'DEBIT',
      category: constantsStore.normalizeCategory(currentEvent.value.category),
      frequency: currentEvent.value.frequency || 'MONTHLY',
      startDate: toDateInputValue(currentEvent.value.start_date) || toDateInputValue(new Date()),
      endDate:
        toDateInputValue(currentEvent.value.end_date) ||
        toDateInputValue(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
      amount: currentEvent.value.amount || null,
      active: currentEvent.value.active !== undefined ? currentEvent.value.active : true,
      profileID: currentEvent.value.profile_id || currentEvent.value.profileID || '',
      scenarioID: currentEvent.value.scenario_id || currentEvent.value.scenarioID || '',
      principal: currentEvent.value.principal ?? '',
      interest: currentEvent.value.interest ?? '',
      monthlyAmount: currentEvent.value.monthly_payment ?? '',
      loanTerm: currentEvent.value.term
        ? String(currentEvent.value.term)
        : currentEvent.value.loan_term
          ? String(currentEvent.value.loan_term)
          : '',
      escrow: currentEvent.value.escrow ?? '',
    }

    if (constantsStore.isLoanCategory(newEvent.value.category)) {
      nextTick(() => debouncedCalculateLoan())
    }
  } else {
    // For new events, set up default scenario
    const scenarioID = route.query.scenarioID || scenariosStore.selectedScenario?.id
    const profileID = route.query.profileID

    newEvent.value.scenarioID = scenarioID || ''
    newEvent.value.profileID = profileID || ''
  }
}

async function loadEvent() {
  const eventID = route.query.eventID

  if (eventID) {
    console.log('=== FETCHING EVENT ===')
    isLoadingEvent.value = true
    try {
      const event = await eventsStore.fetchEventById(eventID)
      if (event) {
        currentEvent.value = event
      } else {
        $q.notify({
          type: 'negative',
          message: 'Failed to load event details. Please try again.',
          position: 'top',
        })
      }
    } catch (error) {
      console.error('Error loading event:', error)
      $q.notify({
        type: 'negative',
        message: 'Failed to load event details. Please try again.',
        position: 'top',
      })
    } finally {
      isLoadingEvent.value = false
      console.log('=== END FETCHING EVENT ===')
    }
  }

  // Load current event data (either from fetched event or initialize for new event)
  loadCurrentEventData()
  console.log('=== END LOADING EVENT DATA ===')
}

async function saveEvent() {
  isSaving.value = true
  try {
    const formattedStartDate = toDateInputValue(newEvent.value.startDate)
    const formattedEndDate = toDateInputValue(newEvent.value.endDate)

    if (!formattedStartDate || !formattedEndDate) {
      throw new Error('Start date and end date are required')
    }

    // Use currentEvent.id if editing an existing event
    const eventID = currentEvent.value ? currentEvent.value.id : null

    if (eventID) {
      // Updating existing event
      const monthlyPayment = isLoanCategory.value ? resolvedMonthlyPayment() : 0
      const calculatedEndDate =
        isLoanCategory.value && loanCalculationPreview.value?.endDate
          ? toDateInputValue(loanCalculationPreview.value.endDate)
          : formattedEndDate

      const updatePayload = {
        eventID: eventID,
        profileID: newEvent.value.profileID,
        scenarioID: newEvent.value.scenarioID,
        name: newEvent.value.name,
        description: newEvent.value.description || '',
        type: newEvent.value.type,
        category: constantsStore.normalizeCategory(newEvent.value.category),
        frequency: newEvent.value.frequency,
        startDate: formattedStartDate,
        endDate: calculatedEndDate || formattedEndDate,
        amount: parseFloat(newEvent.value.amount),
        active: newEvent.value.active ?? true,
        principal: newEvent.value.principal ? parseFloat(newEvent.value.principal) : 0,
        interest: newEvent.value.interest ? parseFloat(newEvent.value.interest) : 0,
        calculatedEndDate: calculatedEndDate || formattedEndDate,
        monthlyPayment,
        escrow: newEvent.value.escrow ? parseFloat(newEvent.value.escrow) : 0,
        term: newEvent.value.loanTerm ? parseInt(newEvent.value.loanTerm, 10) : 0,
      }

      await eventsStore.updateEvent(eventID, updatePayload)
      showSuccessCheckmark()
    } else {
      // Creating new event - explicitly set ALL 18 fields, use null for empty values (matching original app)
      const monthlyPayment = isLoanCategory.value ? resolvedMonthlyPayment() : null
      const calculatedEndDate =
        isLoanCategory.value && loanCalculationPreview.value?.endDate
          ? toDateInputValue(loanCalculationPreview.value.endDate)
          : formattedEndDate

      const createPayload = {
        active: newEvent.value.active ?? true,
        amount: parseFloat(newEvent.value.amount),
        calculatedEndDate: calculatedEndDate || formattedEndDate,
        category: constantsStore.normalizeCategory(newEvent.value.category),
        description: newEvent.value.description || '',
        endDate: calculatedEndDate || formattedEndDate,
        escrow: newEvent.value.escrow ? parseFloat(newEvent.value.escrow) : null,
        frequency: newEvent.value.frequency,
        interest: newEvent.value.interest ? parseFloat(newEvent.value.interest) : null,
        loanTerm: newEvent.value.loanTerm ? parseInt(newEvent.value.loanTerm, 10) : null,
        monthlyAmount: monthlyPayment != null ? String(monthlyPayment) : '',
        monthlyPayment,
        name: newEvent.value.name,
        principal: newEvent.value.principal != null && newEvent.value.principal !== ''
          ? parseFloat(newEvent.value.principal)
          : 0,
        profileID: newEvent.value.profileID,
        scenarioID: newEvent.value.scenarioID,
        startDate: formattedStartDate,
        type: newEvent.value.type,
      }

      console.log('=== PageTransaction createPayload ===')
      console.log('Keys:', Object.keys(createPayload).length, 'fields')
      console.log('Payload:', JSON.stringify(createPayload, null, 2))
      await eventsStore.createEvent(createPayload)
      showSuccessCheckmark()
    }

    // The plan changed, so the cached Home view is stale.
    overviewStore.invalidate()
    eventsStore.invalidateMonthSnapshot()
    await router.push({ name: 'Overview' })
  } catch (error) {
    console.error('Error saving event:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to save transaction',
      position: 'top',
    })
  } finally {
    isSaving.value = false
  }
}

async function removeEvent() {
  $q.dialog({
    title: 'Confirm Delete',
    message: 'Are you sure you want to delete this transaction?',
    cancel: true,
    persistent: true,
    class: 'dark-dialog',
    style: 'background: rgba(30, 30, 35, 0.98); color: white;',
  }).onOk(async () => {
    try {
      // Try both id and _id in case the event uses different ID field
      const eventId = currentEvent.value?.id || currentEvent.value?._id
      if (!eventId) {
        throw new Error('Event ID not found')
      }

      // Delete the event
      await eventsStore.deleteEvent(eventId)

      // The plan changed, so the cached Home view is stale.
      overviewStore.invalidate()

      // Update calendar days to reflect the deletion
      try {
        calendarStore.updateCalendarDays()
      } catch (calendarError) {
        console.warn('Error updating calendar days:', calendarError)
        // Don't fail the deletion if calendar update fails
      }

      // Show success checkmark
      showSuccessCheckmark()

      // Wait for Vue to finish updating and animations
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Navigate back safely
      try {
        if (router.currentRoute.value.path === '/transaction') {
          router.back()
        } else {
          // If we can't go back, return to Overview (the calendar now lives there)
          router.push('/overview')
        }
      } catch (navError) {
        console.error('Navigation error:', navError)
        // Fallback navigation
        router.push('/overview')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      $q.notify({
        type: 'negative',
        message: error.message || 'Failed to delete transaction',
        position: 'top',
      })
    }
  })
}

onMounted(async () => {
  const profileID = route.query.profileID
  const scenarioID = route.query.scenarioID

  // Ensure profile is set in events store
  if (profileID && !eventsStore.profile?.id) {
    const profiles = await profileStore.fetchProfiles()
    const profile = profiles.find((p) => p.id === profileID)
    if (profile) {
      eventsStore.setProfile(profile)
    }
  }

  // Ensure scenario is selected if we have scenarioID
  if (scenarioID && scenariosStore.selectedScenario?.id !== scenarioID) {
    // Fetch scenarios if not already loaded
    if (!scenariosStore.allScenarios || scenariosStore.allScenarios.length === 0) {
      await scenariosStore.fetchScenarios()
    }
    const scenarios = scenariosStore.allScenarios
    const scenario = scenarios.find((s) => s.id === scenarioID)
    if (scenario) {
      scenariosStore.selectScenario(scenario)
    }
  }

  if (profileID) {
    newEvent.value.profileID = profileID
  }

  if (scenarioID) {
    newEvent.value.scenarioID = scenarioID
  }

  loadEvent()
})

// Watch loan-related fields to trigger calculation
watch(
  () => newEvent.value.amount,
  () => {
    if (
      isLoanCategory.value &&
      newEvent.value.amount &&
      newEvent.value.interest &&
      newEvent.value.loanTerm
    ) {
      debouncedCalculateLoan()
    }
  },
)

watch(
  () => newEvent.value.interest,
  () => {
    if (
      isLoanCategory.value &&
      newEvent.value.amount &&
      newEvent.value.interest &&
      newEvent.value.loanTerm
    ) {
      debouncedCalculateLoan()
    }
  },
)

watch(
  () => newEvent.value.principal,
  () => {
    if (
      isLoanCategory.value &&
      newEvent.value.amount &&
      newEvent.value.interest &&
      newEvent.value.loanTerm
    ) {
      debouncedCalculateLoan()
    }
  },
)

watch(
  () => newEvent.value.loanTerm,
  () => {
    const hasAllFields =
      newEvent.value.amount &&
      newEvent.value.interest &&
      newEvent.value.loanTerm &&
      newEvent.value.startDate

    if (
      !hasAllFields &&
      isLoanCategory.value &&
      newEvent.value.startDate &&
      newEvent.value.loanTerm
    ) {
      calculateEndDateFromTerm()
    }

    if (
      isLoanCategory.value &&
      newEvent.value.amount &&
      newEvent.value.interest &&
      newEvent.value.loanTerm
    ) {
      debouncedCalculateLoan()
    }
  },
)

watch(
  () => newEvent.value.startDate,
  () => {
    const hasAllFields =
      newEvent.value.amount &&
      newEvent.value.interest &&
      newEvent.value.loanTerm &&
      newEvent.value.startDate

    if (
      !hasAllFields &&
      isLoanCategory.value &&
      newEvent.value.startDate &&
      newEvent.value.loanTerm
    ) {
      calculateEndDateFromTerm()
    }

    if (
      isLoanCategory.value &&
      newEvent.value.amount &&
      newEvent.value.interest &&
      newEvent.value.loanTerm
    ) {
      debouncedCalculateLoan()
    }
  },
)
</script>

<style scoped lang="scss">
.transaction-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 1rem;
  background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.background-scene {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
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

.transaction-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  max-width: 1000px;
  width: 100%;
  padding: 0 2rem 2rem;
  z-index: 2;
  margin: 0 auto;
}

.form-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 1rem 0 2rem 0;
  text-align: center;
  letter-spacing: -0.5px;
}

.transaction-card {
  width: 100%;
  background: var(--bg-dark);
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-primary-border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border-radius: 16px;

  :deep(.q-card__section) {
    padding: 2rem;
  }
}

.form-section {
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--color-primary-border);

  &:last-child {
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
  color: var(--text-primary);
}

.loan-preview-card {
  background: rgba(76, 175, 80, 0.12);
  border: 1px solid rgba(76, 175, 80, 0.35);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1.5rem;
}

.loan-preview-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem;
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
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;

  &.highlight {
    background: rgba(76, 175, 80, 0.18);
    border: 1px solid rgba(76, 175, 80, 0.4);
  }
}

.loan-preview-label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.loan-preview-value {
  flex: 0 0 auto;
  white-space: nowrap;
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 600;
  text-align: right;

  .highlight & {
    color: #4caf50;
    font-size: 1.05rem;
  }
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-primary-border);

  :deep(.q-btn) {
    flex: 1;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 1px;
    border-radius: 12px;
    transition: all 0.3s ease;

    &[color='primary'] {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    &[color='negative'] {
      background: var(--bg-glass);
      border: 2px solid var(--border-primary);
      color: var(--text-primary);

      &:hover {
        background: var(--bg-glass-hover);
        border-color: var(--border-primary);
        transform: translateY(-2px);
      }
    }
  }
}

// Input styling
:deep(.q-field) {
  .q-field__control {
    background: var(--bg-glass);
    border-color: var(--color-primary-border);
    border-radius: 8px;
    color: var(--text-primary);

    &:hover {
      background: var(--bg-glass-hover);
      border-color: var(--color-primary-border);
    }
  }

  .q-field__label {
    color: var(--text-secondary);
  }

  .q-field__native {
    color: var(--text-primary);
  }

  .q-field__messages {
    color: var(--text-secondary) !important;
  }

  .q-field__hint {
    color: var(--text-tertiary) !important;
  }

  &.q-field--focused {
    .q-field__control {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px var(--color-primary-light);
    }

    .q-field__label {
      color: var(--color-primary);
    }
  }
}

// Tablet and desktop optimizations
@media (min-width: 1024px) {
  .transaction-page {
    padding: clamp(1.5rem, 2vw, 2.5rem);
  }

  // Make container wider on desktop with fluid scaling
  .transaction-container {
    max-width: min(90vw, 1200px);
    width: 100%;
    padding: 0 clamp(1.5rem, 2vw, 2.5rem) clamp(1.5rem, 2vw, 2.5rem);
  }

  // Make content boxes wider to fill space better with fluid padding
  .transaction-card {
    :deep(.q-card__section) {
      padding: clamp(1.5rem, 2.5vw, 2.5rem) clamp(2rem, 3vw, 3rem);
    }
  }
}

// Large desktop screens (1440px+)
@media (min-width: 1440px) {
  .transaction-container {
    max-width: min(92vw, 1400px);
  }

  .transaction-card {
    :deep(.q-card__section) {
      padding: clamp(1.75rem, 2.5vw, 3rem) clamp(2.5rem, 3.5vw, 4rem);
    }
  }
}

// Extra large screens (1920px+)
@media (min-width: 1920px) {
  .transaction-container {
    max-width: min(94vw, 1600px);
  }

  .transaction-card {
    :deep(.q-card__section) {
      padding: clamp(2rem, 2.5vw, 3.5rem) clamp(3rem, 4vw, 5rem);
    }
  }
}

@media (max-width: 768px) {
  .transaction-page {
    padding-top: 0.5rem;
  }

  .transaction-container {
    padding: 0 1rem 1.5rem;
  }

  .form-title {
    font-size: 2rem;
    margin: 0.5rem 0 1.5rem 0;
  }

  .transaction-card {
    :deep(.q-card__section) {
      padding: 1.5rem;
    }
  }

  .form-actions {
    flex-direction: column;

    :deep(.q-btn) {
      width: 100%;
    }
  }
}
</style>

<style lang="scss">
// Global styles for delete confirmation dialog
:deep(.q-dialog) {
  .q-dialog__inner {
    .q-card {
      background: rgba(30, 30, 35, 0.98) !important;
      backdrop-filter: blur(20px) !important;
      border: 2px solid rgba(255, 255, 255, 0.2) !important;
      border-radius: 16px !important;
      color: white !important;
      padding: 2rem !important;
      min-width: 400px;
      max-width: 500px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;

      .q-card__section {
        color: white !important;
        padding: 0 !important;

        &:first-child {
          padding-bottom: 1rem !important;
          margin-bottom: 1rem !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
      }

      .q-dialog__title {
        color: white !important;
        font-size: 1.5rem !important;
        font-weight: 600 !important;
        margin: 0 0 1rem 0 !important;
      }

      .q-dialog__message {
        color: rgba(255, 255, 255, 0.9) !important;
        font-size: 1rem !important;
        line-height: 1.5 !important;
        margin-bottom: 1.5rem !important;
      }

      .q-dialog__actions {
        display: flex !important;
        gap: 1rem !important;
        justify-content: flex-end !important;
        padding-top: 1rem !important;
        border-top: 1px solid rgba(255, 255, 255, 0.1) !important;

        .q-btn {
          padding: 0.75rem 1.5rem !important;
          border-radius: 12px !important;
          font-size: 1rem !important;
          font-weight: 500 !important;
          transition: all 0.3s ease !important;
          min-width: 100px !important;

          &.q-btn--flat {
            background: rgba(255, 255, 255, 0.1) !important;
            border: 2px solid rgba(255, 255, 255, 0.3) !important;
            color: white !important;

            &:hover {
              background: rgba(255, 255, 255, 0.15) !important;
              border-color: rgba(255, 255, 255, 0.5) !important;
              transform: translateY(-2px) !important;
            }
          }

          &:not(.q-btn--flat) {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border: none !important;
            color: white !important;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;

            &:hover {
              transform: translateY(-3px) !important;
              box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4) !important;
            }
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  :deep(.q-dialog) {
    .q-dialog__inner {
      .q-card {
        min-width: 90vw !important;
        max-width: 90vw !important;
        padding: 1.5rem !important;

        .q-dialog__title {
          font-size: 1.25rem !important;
        }

        .q-dialog__message {
          font-size: 0.95rem !important;
        }

        .q-dialog__actions {
          flex-direction: column-reverse !important;

          .q-btn {
            width: 100% !important;
          }
        }
      }
    }
  }
}
</style>
