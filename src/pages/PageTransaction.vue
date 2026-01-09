<template>
  <q-page class="transaction-page">
    <div class="transaction-container">
      <div class="transaction-header q-mb-lg">
        <q-btn
          flat
          dense
          icon="arrow_back"
          label="Back"
          @click="goBack"
          no-caps
        />
        <h1 class="transaction-title">
          {{ currentEvent ? 'Edit Transaction' : 'Add Transaction' }}
        </h1>
      </div>

      <q-inner-loading :showing="isLoadingEvent" />

      <q-card v-if="!isLoadingEvent" class="glass-card">
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
                  <q-input
                    v-model="newEvent.name"
                    label="Name"
                    outlined
                    dense
                    required
                  />
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
                    label="Amount ($)"
                    outlined
                    dense
                    required
                    step="0.01"
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

                <div class="col-12 col-md-6">
                  <q-input
                    v-model="newEvent.endDate"
                    type="date"
                    label="End Date"
                    outlined
                    dense
                    required
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useScenariosStore } from '../stores/scenarios'
import { useEventsStore } from '../stores/events'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const scenariosStore = useScenariosStore()
const eventsStore = useEventsStore()

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

const scenarioOptions = computed(() => {
  return scenariosStore.allScenarios.map((s) => ({
    label: s.name,
    value: s.id,
  }))
})

function handleCategoryChange(value) {
  const incomeCategories = ['PRIMARY_INCOME', 'SECONDARY_INCOME', 'MISC']
  if (incomeCategories.includes(value)) {
    newEvent.value.type = 'CREDIT'
  } else {
    newEvent.value.type = 'DEBIT'
  }
}

async function loadEvent() {
  const eventID = route.query.eventID
  if (eventID) {
    isLoadingEvent.value = true
    try {
      const event = await eventsStore.fetchEventById(eventID)
      if (event) {
        currentEvent.value = event
        newEvent.value = {
          name: event.name || '',
          description: event.description || '',
          amount: event.amount || null,
          category: event.category || '',
          frequency: event.frequency || 'MONTHLY',
          type: event.type || 'DEBIT',
          startDate: event.start_date ? event.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
          endDate: event.end_date ? event.end_date.split('T')[0] : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          scenarioID: event.scenario_id || '',
          profileID: event.profile_id || '',
        }
      }
    } catch (error) {
      console.error('Error loading event:', error)
      $q.notify({
        type: 'negative',
        message: 'Failed to load event',
        position: 'top',
      })
    } finally {
      isLoadingEvent.value = false
    }
  }
}

async function saveEvent() {
  isSaving.value = true
  try {
    const eventData = {
      name: newEvent.value.name,
      description: newEvent.value.description,
      amount: parseFloat(newEvent.value.amount),
      category: newEvent.value.category,
      frequency: newEvent.value.frequency,
      type: newEvent.value.type,
      start_date: newEvent.value.startDate,
      end_date: newEvent.value.endDate,
      scenario_id: newEvent.value.scenarioID,
      active: true,
    }

    if (currentEvent.value) {
      await eventsStore.updateEvent(currentEvent.value.id, eventData)
      $q.notify({
        type: 'positive',
        message: 'Transaction updated successfully',
        position: 'top',
      })
    } else {
      await eventsStore.createEvent(eventData)
      $q.notify({
        type: 'positive',
        message: 'Transaction created successfully',
        position: 'top',
      })
    }

    goBack()
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
      goBack()
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

function goBack() {
  router.push('/calendar')
}

onMounted(() => {
  const profileID = route.query.profileID
  const scenarioID = route.query.scenarioID

  if (profileID) {
    newEvent.value.profileID = profileID
  }

  if (scenarioID) {
    newEvent.value.scenarioID = scenarioID
  }

  loadEvent()
})
</script>

<style scoped lang="scss">
.transaction-page {
  padding: 2rem;
  min-height: 100vh;
}

.transaction-container {
  max-width: 1000px;
  margin: 0 auto;
}

.transaction-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.transaction-title {
  font-size: 2rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.form-section {
  padding: 1.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .transaction-page {
    padding: 1rem;
  }

  .transaction-title {
    font-size: 1.5rem;
  }
}
</style>
