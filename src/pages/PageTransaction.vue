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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useScenariosStore } from '../stores/scenarios'
import { useEventsStore } from '../stores/events'
import { useProfileStore } from '../stores/profile'
import { useConstantsStore } from '../stores/constants'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const scenariosStore = useScenariosStore()
const eventsStore = useEventsStore()
const profileStore = useProfileStore()
const constantsStore = useConstantsStore()

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
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
      // Updating existing event
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
        active: newEvent.value.active ?? true,
        principal: newEvent.value.principal ? parseFloat(newEvent.value.principal) : 0,
        interest: newEvent.value.interest ? parseFloat(newEvent.value.interest) : 0,
        calculatedEndDate: formattedEndDate,
        monthlyPayment: newEvent.value.monthlyAmount ? parseFloat(newEvent.value.monthlyAmount) : 0,
        escrow: newEvent.value.escrow ? parseFloat(newEvent.value.escrow) : 0,
        term: newEvent.value.loanTerm ? parseInt(newEvent.value.loanTerm) : 0,
      }

      await eventsStore.updateEvent(eventID, updatePayload)
      $q.notify({
        type: 'positive',
        message: 'Transaction updated successfully',
        position: 'top',
      })
    } else {
      // Creating new event - explicitly set ALL 18 fields, use null for empty values (matching original app)
      const createPayload = {
        active: newEvent.value.active ?? true,
        amount: parseFloat(newEvent.value.amount),
        calculatedEndDate: formattedEndDate,
        category: newEvent.value.category,
        description: newEvent.value.description || '',
        endDate: formattedEndDate,
        escrow: newEvent.value.escrow ? parseFloat(newEvent.value.escrow) : null,
        frequency: newEvent.value.frequency,
        interest: newEvent.value.interest ? parseFloat(newEvent.value.interest) : null,
        loanTerm: newEvent.value.loanTerm ? parseInt(newEvent.value.loanTerm) : null,
        monthlyAmount: newEvent.value.monthlyAmount ? String(newEvent.value.monthlyAmount) : '',
        monthlyPayment: newEvent.value.monthlyAmount
          ? parseFloat(newEvent.value.monthlyAmount)
          : null,
        name: newEvent.value.name,
        principal: newEvent.value.principal ? parseFloat(newEvent.value.principal) : null,
        profileID: newEvent.value.profileID,
        scenarioID: newEvent.value.scenarioID,
        startDate: formattedStartDate,
        type: newEvent.value.type,
      }

      console.log('=== PageTransaction createPayload ===')
      console.log('Keys:', Object.keys(createPayload).length, 'fields')
      console.log('Payload:', JSON.stringify(createPayload, null, 2))
      await eventsStore.createEvent(createPayload)
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
    class: 'dark-dialog',
    style: 'background: rgba(30, 30, 35, 0.98); color: white;',
  }).onOk(async () => {
    try {
      // Try both id and _id in case the event uses different ID field
      const eventId = currentEvent.value?.id || currentEvent.value?._id
      if (!eventId) {
        throw new Error('Event ID not found')
      }
      await eventsStore.deleteEvent(eventId)
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
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.5);
        transform: translateY(-2px);
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
