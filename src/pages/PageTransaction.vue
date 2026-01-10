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
                <div
                  v-if="isLoanCategory && newEvent.loanTerm && newEvent.startDate"
                  class="col-12 col-md-6"
                >
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
            </div>

            <!-- Form Actions -->
            <div class="form-actions q-mt-lg">
              <q-btn
                v-if="currentEvent"
                label="Delete"
                color="negative"
                @click="removeEvent"
                no-caps
              />
              <q-space />
              <q-btn
                type="submit"
                :label="currentEvent ? 'Update' : 'Save'"
                color="primary"
                :loading="isSaving"
                no-caps
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useScenariosStore } from '../stores/scenarios'
import { useEventsStore } from '../stores/events'
import { useProfileStore } from '../stores/profile'
import axios from 'axios'
import { getAPIURL } from '../js/api'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const scenariosStore = useScenariosStore()
const eventsStore = useEventsStore()
const profileStore = useProfileStore()

const isLoadingEvent = ref(false)
const isSaving = ref(false)
const currentEvent = ref(null)

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

const categoryOptions = [
  { label: 'Mortgage', value: 'MORTGAGE' },
  { label: 'Rent', value: 'RENT' },
  { label: 'Grocery', value: 'GROCERY' },
  { label: 'Dining', value: 'DINING' },
  { label: 'Entertainment', value: 'ENTERTAINMENT' },
  { label: 'Utilities', value: 'UTILITY' },
  { label: 'Subscription', value: 'SUBSCRIPTION' },
  { label: 'Insurance', value: 'INSURANCE' },
  { label: 'Generic Loan', value: 'GENERIC_LOAN' },
  { label: 'Auto Loan', value: 'AUTO_LOAN' },
  { label: 'Credit Card', value: 'CREDIT_CARD' },
  { label: 'Phone', value: 'PHONE' },
  { label: 'Savings', value: 'SAVINGS' },
  { label: 'Primary Income', value: 'PRIMARY_INCOME' },
  { label: 'Secondary Income', value: 'SECONDARY_INCOME' },
  { label: 'Misc Income', value: 'MISC' },
]

const frequencyOptions = [
  { label: 'Once', value: 'ONCE' },
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Every Other Week', value: 'EVERY_OTHER_WEEK' },
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Every Other Month', value: 'EVERY_OTHER_MONTH' },
  { label: 'Yearly', value: 'YEARLY' },
]

const typeOptions = [
  { label: 'Income', value: 'CREDIT' },
  { label: 'Expense', value: 'DEBIT' },
]

const loanTermOptions = [
  { label: '12 months (1 year)', value: '12' },
  { label: '24 months (2 years)', value: '24' },
  { label: '36 months (3 years)', value: '36' },
  { label: '48 months (4 years)', value: '48' },
  { label: '60 months (5 years)', value: '60' },
  { label: '72 months (6 years)', value: '72' },
  { label: '84 months (7 years)', value: '84' },
  { label: '96 months (8 years)', value: '96' },
  { label: '108 months (9 years)', value: '108' },
  { label: '120 months (10 years)', value: '120' },
  { label: '132 months (11 years)', value: '132' },
  { label: '144 months (12 years)', value: '144' },
  { label: '156 months (13 years)', value: '156' },
  { label: '168 months (14 years)', value: '168' },
  { label: '180 months (15 years)', value: '180' },
  { label: '192 months (16 years)', value: '192' },
  { label: '204 months (17 years)', value: '204' },
  { label: '216 months (18 years)', value: '216' },
  { label: '228 months (19 years)', value: '228' },
  { label: '240 months (20 years)', value: '240' },
  { label: '252 months (21 years)', value: '252' },
  { label: '264 months (22 years)', value: '264' },
  { label: '276 months (23 years)', value: '276' },
  { label: '288 months (24 years)', value: '288' },
  { label: '300 months (25 years)', value: '300' },
  { label: '312 months (26 years)', value: '312' },
  { label: '324 months (27 years)', value: '324' },
  { label: '336 months (28 years)', value: '336' },
  { label: '348 months (29 years)', value: '348' },
  { label: '360 months (30 years)', value: '360' },
]

const scenarioOptions = computed(() => {
  return scenariosStore.allScenarios.map((s) => ({
    label: s.name,
    value: s.id,
  }))
})

const isLoanCategory = computed(() => {
  const loanCategories = ['MORTGAGE', 'AUTO_LOAN', 'GENERIC_LOAN']
  return loanCategories.includes(newEvent.value.category)
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
      category: currentEvent.value.category || '',
      frequency: currentEvent.value.frequency || 'MONTHLY',
      startDate: currentEvent.value.start_date
        ? new Date(currentEvent.value.start_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      endDate: currentEvent.value.end_date
        ? new Date(currentEvent.value.end_date).toISOString().split('T')[0]
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
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
    // Format dates before sending to API
    const formattedStartDate = newEvent.value.startDate.split('T')[0]
    const formattedEndDate = newEvent.value.endDate.split('T')[0]

    // Use currentEvent.id if editing an existing event
    const eventID = currentEvent.value ? currentEvent.value.id : null

    if (eventID) {
      // Updating existing event - build clean payload matching backend expectations
      // Note: DAL function uses defaults (?? 0 or ?? ''), so we can send 0/'' instead of null
      const updatePayload = {
        eventID: eventID,
        profileID: newEvent.value.profileID,
        scenarioID: newEvent.value.scenarioID,
        name: newEvent.value.name,
        description: newEvent.value.description || '',
        type: newEvent.value.type,
        category: newEvent.value.category,
        frequency: newEvent.value.frequency,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        amount: parseFloat(newEvent.value.amount),
        active: newEvent.value.active !== undefined ? newEvent.value.active : true,
        principal:
          newEvent.value.principal === '' || newEvent.value.principal === null
            ? 0
            : parseFloat(newEvent.value.principal),
        interest:
          newEvent.value.interest === '' || newEvent.value.interest === null
            ? 0
            : parseFloat(newEvent.value.interest),
        calculatedEndDate: formattedEndDate || '', // For now, use endDate. Could be calculated for loans
        monthlyPayment:
          newEvent.value.monthlyAmount === '' ||
          newEvent.value.monthlyAmount === null
            ? 0
            : parseFloat(newEvent.value.monthlyAmount),
        escrow:
          newEvent.value.escrow === '' || newEvent.value.escrow === null
            ? 0
            : parseFloat(newEvent.value.escrow),
      }

      // Only include term if it has a valid value (update uses 'term', not 'loanTerm')
      // If not included, DAL will default to 0
      if (newEvent.value.loanTerm && newEvent.value.loanTerm !== '' && newEvent.value.loanTerm !== null) {
        updatePayload.term = parseInt(newEvent.value.loanTerm)
      } else {
        updatePayload.term = 0
      }

      await axios.put(`${getAPIURL()}/api/scenario/update-event`, updatePayload)

      // Refresh events after update
      await eventsStore.fetchEvents()
      await eventsStore.fetchEventsForMonthByScenario()
      $q.notify({
        type: 'positive',
        message: 'Transaction updated successfully',
        position: 'top',
      })
    } else {
      // Creating new event - build clean payload matching backend expectations
      // Note: DAL function uses defaults (?? 0 or ?? ''), so we can send 0/'' instead of null
      const createPayload = {
        profileID: newEvent.value.profileID,
        scenarioID: newEvent.value.scenarioID,
        name: newEvent.value.name,
        description: newEvent.value.description || '',
        type: newEvent.value.type,
        category: newEvent.value.category,
        frequency: newEvent.value.frequency,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        amount: parseFloat(newEvent.value.amount),
        active: newEvent.value.active !== undefined ? newEvent.value.active : true,
        principal:
          newEvent.value.principal === '' || newEvent.value.principal === null
            ? 0
            : parseFloat(newEvent.value.principal),
        interest:
          newEvent.value.interest === '' || newEvent.value.interest === null
            ? 0
            : parseFloat(newEvent.value.interest),
        calculatedEndDate: formattedEndDate || '', // For now, use endDate. Could be calculated for loans
        monthlyPayment:
          newEvent.value.monthlyAmount === '' ||
          newEvent.value.monthlyAmount === null
            ? 0
            : parseFloat(newEvent.value.monthlyAmount),
        escrow:
          newEvent.value.escrow === '' || newEvent.value.escrow === null
            ? 0
            : parseFloat(newEvent.value.escrow),
      }

      // Only include loanTerm if it has a valid value (create uses 'loanTerm', not 'term')
      // If not included, DAL will default to 0
      if (newEvent.value.loanTerm && newEvent.value.loanTerm !== '' && newEvent.value.loanTerm !== null) {
        createPayload.loanTerm = parseInt(newEvent.value.loanTerm)
      } else {
        createPayload.loanTerm = 0
      }

      await axios.post(`${getAPIURL()}/api/scenario/create-event`, createPayload)

      // Refresh events after create
      await eventsStore.fetchEvents()
      await eventsStore.fetchEventsForMonthByScenario()
      $q.notify({
        type: 'positive',
        message: 'Transaction created successfully',
        position: 'top',
      })
    }

    router.back()
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
  }).onOk(async () => {
    try {
      await eventsStore.deleteEvent(currentEvent.value.id)
      $q.notify({
        type: 'positive',
        message: 'Transaction deleted successfully',
        position: 'top',
      })
      router.back()
    } catch (error) {
      console.error('Error deleting event:', error)
      $q.notify({
        type: 'negative',
        message: 'Failed to delete transaction',
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

// Watch loan term and start date to calculate end date automatically
watch(
  () => newEvent.value.loanTerm,
  () => {
    if (isLoanCategory.value && newEvent.value.startDate && newEvent.value.loanTerm) {
      calculateEndDateFromTerm()
    }
  },
)

watch(
  () => newEvent.value.startDate,
  () => {
    if (isLoanCategory.value && newEvent.value.startDate && newEvent.value.loanTerm) {
      calculateEndDateFromTerm()
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
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
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
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(168, 85, 247, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border-radius: 16px;

  :deep(.q-card__section) {
    padding: 2rem;
  }
}

.form-section {
  padding: 1.5rem 0;
  border-bottom: 1px solid rgba(168, 85, 247, 0.2);

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
  color: white;
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(168, 85, 247, 0.2);

  :deep(.q-btn) {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 12px;
    transition: all 0.3s ease;

    &[color='primary'] {
      background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);

      &:hover {
        background: linear-gradient(135deg, #9333ea 0%, #6d28d9 100%);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(168, 85, 247, 0.4);
      }
    }

    &[color='negative'] {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: 2px solid rgba(239, 68, 68, 0.3);

      &:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.5);
      }
    }
  }
}

// Input styling
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
