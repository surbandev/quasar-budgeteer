<template>
  <q-page class="feedback-page">
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

    <div class="feedback-container">
      <h2 class="form-title">Feedback</h2>

      <q-form @submit="submitFeedback" class="feedback-form">
        <div class="form-group">
          <label>Feedback Type</label>
          <q-select
            v-model="feedbackForm.type"
            :options="feedbackTypes"
            class="form-input feedback-type-select"
            borderless
            dense
            emit-value
            map-options
            required
            dark
          />
        </div>

        <div class="form-group">
          <label>Subject</label>
          <q-input
            v-model="feedbackForm.subject"
            type="text"
            placeholder="Brief summary of your feedback"
            class="form-input"
            borderless
            dense
            required
          />
        </div>

        <div class="form-group">
          <label>Message</label>
          <q-input
            v-model="feedbackForm.message"
            type="textarea"
            placeholder="Please provide as much detail as possible"
            class="form-input"
            borderless
            rows="6"
            required
          />
        </div>

        <div class="form-group">
          <label>Email (optional)</label>
          <q-input
            v-model="feedbackForm.email"
            type="email"
            placeholder="If you'd like us to follow up with you"
            class="form-input"
            borderless
            dense
          />
        </div>

        <div class="form-actions">
          <q-btn
            type="button"
            label="Cancel"
            @click="goBack"
            class="cancel-button"
            unelevated
            no-caps
          />
          <q-btn
            type="submit"
            label="Submit Feedback"
            :loading="isSubmitting"
            class="submit-button"
            unelevated
            no-caps
          />
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()

const isSubmitting = ref(false)

const feedbackForm = ref({
  type: '',
  subject: '',
  message: '',
  email: '',
})

const feedbackTypes = [
  { label: 'Bug Report', value: 'bug' },
  { label: 'Feature Request', value: 'feature' },
  { label: 'General Feedback', value: 'general' },
  { label: 'Question', value: 'question' },
  { label: 'Other', value: 'other' },
]

async function submitFeedback() {
  isSubmitting.value = true
  try {
    // Implement feedback submission logic here
    await new Promise((resolve) => setTimeout(resolve, 1500))

    $q.notify({
      type: 'positive',
      message: 'Thank you for your feedback!',
      position: 'top',
      timeout: 2000,
    })

    // Reset form
    feedbackForm.value = {
      type: '',
      subject: '',
      message: '',
      email: '',
    }

    goBack()
  } catch (error) {
    console.error('Error submitting feedback:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to submit feedback. Please try again.',
      position: 'top',
    })
  } finally {
    isSubmitting.value = false
  }
}

function goBack() {
  router.push('/dashboard')
}
</script>

<style scoped lang="scss">
.feedback-page {
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

.feedback-container {
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

.feedback-form {
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

.form-input :deep(.q-field__messages) {
  color: rgba(255, 255, 255, 0.7) !important;
}

.form-input :deep(.q-field__hint) {
  color: rgba(255, 255, 255, 0.6) !important;
}

.form-input :deep(.q-field__append) {
  color: rgba(255, 255, 255, 0.7);
}

// Force q-select to match q-input size exactly
.feedback-type-select {
  width: 100%;

  :deep(.q-field) {
    min-height: 46px !important;
    height: 46px !important;
    max-height: 46px !important;
  }

  :deep(.q-field__control) {
    min-height: 46px !important;
    height: 46px !important;
    max-height: 46px !important;
    padding: 0.75rem 1rem !important;
  }

  :deep(.q-field__inner) {
    min-height: 46px !important;
    max-height: 46px !important;
    height: 46px !important;
    padding: 0 !important;
  }

  :deep(.q-field__native) {
    min-height: auto !important;
    height: auto !important;
    padding: 0 !important;
    line-height: 1.5 !important;
  }

  :deep(.q-field__append) {
    min-width: auto !important;
    padding: 0 !important;
  }
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-button,
.submit-button {
  width: 100%;
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
  .feedback-container {
    padding: 1rem;
  }

  .form-title {
    font-size: 2.25rem;
    margin-bottom: 1.5rem;
  }

  .form-actions {
    margin-top: 1.5rem;
  }
}
</style>
