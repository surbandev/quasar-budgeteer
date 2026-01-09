<template>
  <q-page class="scenario-page">
    <div class="scenario-container">
      <div class="scenario-header q-mb-lg">
        <q-btn flat dense icon="arrow_back" label="Back" @click="goBack" no-caps />
        <h1 class="scenario-title">Create Scenario</h1>
      </div>

      <q-card class="glass-card">
        <q-card-section>
          <q-form @submit="createScenario" class="q-gutter-md">
            <q-input
              v-model="scenarioForm.name"
              label="Scenario Name"
              outlined
              dense
              required
              hint="Enter a descriptive name for your scenario"
            />

            <q-input
              v-model="scenarioForm.description"
              label="Description"
              type="textarea"
              outlined
              rows="4"
              required
              hint="Describe what this scenario represents"
            />

            <q-checkbox
              v-model="scenarioForm.is_default"
              label="Set as default scenario"
              color="primary"
            />

            <div class="form-actions q-mt-lg">
              <q-btn
                label="Cancel"
                flat
                @click="goBack"
                no-caps
              />
              <q-space />
              <q-btn
                type="submit"
                label="Create Scenario"
                color="primary"
                :loading="isCreating"
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useScenariosStore } from '../stores/scenarios'

const router = useRouter()
const $q = useQuasar()
const scenariosStore = useScenariosStore()

const isCreating = ref(false)

const scenarioForm = ref({
  name: '',
  description: '',
  is_default: false,
})

async function createScenario() {
  isCreating.value = true
  try {
    await scenariosStore.createScenario(
      scenarioForm.value.name,
      scenarioForm.value.description,
      scenarioForm.value.is_default
    )

    $q.notify({
      type: 'positive',
      message: 'Scenario created successfully',
      position: 'top',
    })

    goBack()
  } catch (error) {
    console.error('Error creating scenario:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to create scenario',
      position: 'top',
    })
  } finally {
    isCreating.value = false
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
