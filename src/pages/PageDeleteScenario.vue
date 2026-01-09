<template>
  <q-page class="scenario-page">
    <div class="scenario-container">
      <div class="scenario-header q-mb-lg">
        <q-btn flat dense icon="arrow_back" label="Back" @click="goBack" no-caps />
        <h1 class="scenario-title">Delete Scenario</h1>
      </div>

      <q-card class="glass-card">
        <q-card-section>
          <div class="warning-container">
            <q-icon name="warning" size="lg" color="warning" />
            <h3 class="warning-title">Warning: This action cannot be undone!</h3>
          </div>

          <div class="scenario-details q-my-lg">
            <div class="detail-row">
              <span class="detail-label">Scenario Name:</span>
              <span class="detail-value">{{ scenarioName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Description:</span>
              <span class="detail-value">{{ scenarioDescription }}</span>
            </div>
          </div>

          <q-banner class="bg-negative text-white q-mb-md">
            <template v-slot:avatar>
              <q-icon name="error" />
            </template>
            Deleting this scenario will permanently remove all associated transactions and data.
            This action cannot be reversed.
          </q-banner>

          <div class="form-actions">
            <q-btn
              label="Cancel"
              flat
              @click="goBack"
              no-caps
            />
            <q-space />
            <q-btn
              label="Delete Scenario"
              color="negative"
              :loading="isDeleting"
              @click="confirmDelete"
              no-caps
            />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useScenariosStore } from '../stores/scenarios'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const scenariosStore = useScenariosStore()

const isDeleting = ref(false)

const scenarioId = computed(() => route.query.scenarioId)
const scenarioName = computed(() => route.query.scenarioName || 'Unknown')
const scenarioDescription = computed(() => route.query.scenarioDescription || 'No description')

function confirmDelete() {
  $q.dialog({
    title: 'Final Confirmation',
    message: 'Are you absolutely sure you want to delete this scenario? This cannot be undone.',
    cancel: true,
    persistent: true,
    ok: {
      label: 'Yes, Delete',
      color: 'negative',
    },
  }).onOk(async () => {
    await deleteScenario()
  })
}

async function deleteScenario() {
  isDeleting.value = true
  try {
    await scenariosStore.deleteScenario(scenarioId.value)

    $q.notify({
      type: 'positive',
      message: 'Scenario deleted successfully',
      position: 'top',
    })

    goBack()
  } catch (error) {
    console.error('Error deleting scenario:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to delete scenario',
      position: 'top',
    })
  } finally {
    isDeleting.value = false
  }
}

function goBack() {
  router.push('/calendar')
}
</script>

<style scoped lang="scss">
.scenario-page {
  padding: 2rem;
  min-height: 100vh;
}

.scenario-container {
  max-width: 800px;
  margin: 0 auto;
}

.scenario-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.scenario-title {
  font-size: 2rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.warning-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.warning-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 193, 7, 0.9);
  margin: 0;
}

.scenario-details {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.detail-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.form-actions {
  display: flex;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .scenario-page {
    padding: 1rem;
  }
}
</style>
