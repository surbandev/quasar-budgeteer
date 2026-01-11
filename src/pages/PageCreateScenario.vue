<template>
  <q-layout>
    <q-page-container>
      <q-page class="scenario-page">
        <!-- Background animations -->
        <div class="background-scene">
          <div class="stars"></div>

          <div class="math-equations">
            <div class="equation equation-1">∫ f(x)dx = F(x) + C</div>
            <div class="equation equation-2">e^(iπ) + 1 = 0</div>
            <div class="equation equation-3">∇ × E = -∂B/∂t</div>
            <div class="equation equation-4">∑(n=1→∞) 1/n² = π²/6</div>
          </div>
        </div>

        <div class="scenario-container">
          <h2 class="form-title">Create Scenario</h2>

          <q-form @submit="createScenario" class="scenario-form">
            <div class="form-group">
              <label>Scenario Name</label>
              <q-input
                v-model="scenarioForm.name"
                type="text"
                placeholder="Enter a descriptive name for your scenario"
                class="form-input"
                borderless
                dense
                required
              />
            </div>

            <div class="form-group">
              <label>Description</label>
              <q-input
                v-model="scenarioForm.description"
                type="textarea"
                placeholder="Describe what this scenario represents"
                class="form-input"
                borderless
                rows="4"
                required
              />
            </div>

            <div class="form-actions">
              <q-btn
                type="button"
                label="Cancel"
                @click="handleCancel"
                class="cancel-button"
                unelevated
                no-caps
              />
              <q-btn
                type="submit"
                label="Create Scenario"
                :loading="isCreating"
                class="submit-button"
                unelevated
                no-caps
              />
            </div>
          </q-form>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
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
})

async function createScenario() {
  isCreating.value = true
  try {
    await scenariosStore.createScenario(
      scenarioForm.value.name,
      scenarioForm.value.description,
      false,
    )

    $q.notify({
      type: 'positive',
      message: 'Scenario created successfully',
      position: 'top',
      timeout: 2000,
    })

    router.back()
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

function handleCancel() {
  router.back()
}
</script>

<style scoped lang="scss">
.scenario-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 1rem;
}

.background-scene {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
}

.stars {
  display: none;
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

.scenario-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  max-width: 600px;
  width: 100%;
  padding: 0 2rem 1.5rem;
  z-index: 2;
}

.form-title {
  color: white;
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 2rem 0;
  text-align: center;
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
}

.scenario-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
}

.form-input {
  width: 100%;
}

.form-input :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  min-height: 46px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.form-input :deep(.q-field__control:hover) {
  border-color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.12);
}

.form-input :deep(.q-field__control:focus-within) {
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.form-input :deep(.q-field__native) {
  color: white;
  font-size: 1rem;
  padding: 0;
  line-height: 1.5;
}

.form-input :deep(.q-field__native::placeholder) {
  color: rgba(255, 255, 255, 0.5);
}

.form-input :deep(textarea.q-field__native) {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 5rem;
}

.cancel-button,
.submit-button {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

.cancel-button {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.submit-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.submit-button :deep(.q-btn__content) {
  font-weight: 600;
  font-size: 1.1rem;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .scenario-container {
    padding: 1rem;
  }

  .form-title {
    font-size: 2.5rem;
    margin-bottom: 2rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-button,
  .submit-button {
    width: 100%;
  }
}
</style>
