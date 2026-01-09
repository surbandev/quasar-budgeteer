<template>
  <q-page class="feedback-page">
    <div class="feedback-container">
      <div class="feedback-header q-mb-lg">
        <q-btn flat dense icon="arrow_back" label="Back" @click="goBack" no-caps />
        <h1 class="feedback-title">Feedback</h1>
      </div>

      <q-card class="glass-card">
        <q-card-section>
          <div class="feedback-intro q-mb-lg">
            <q-icon name="chat_bubble" size="xl" color="primary" />
            <p class="intro-text">
              We'd love to hear your thoughts! Your feedback helps us improve Moneyballs
              and make it better for everyone.
            </p>
          </div>

          <q-form @submit="submitFeedback" class="q-gutter-md">
            <q-select
              v-model="feedbackForm.type"
              :options="feedbackTypes"
              label="Feedback Type"
              outlined
              dense
              emit-value
              map-options
              required
            />

            <q-input
              v-model="feedbackForm.subject"
              label="Subject"
              outlined
              dense
              required
              hint="Brief summary of your feedback"
            />

            <q-input
              v-model="feedbackForm.message"
              label="Message"
              type="textarea"
              outlined
              rows="8"
              required
              hint="Please provide as much detail as possible"
            />

            <q-input
              v-model="feedbackForm.email"
              label="Email (optional)"
              type="email"
              outlined
              dense
              hint="If you'd like us to follow up with you"
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
                label="Submit Feedback"
                color="primary"
                :loading="isSubmitting"
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
  padding: 2rem;
  min-height: 100vh;
}

.feedback-container {
  max-width: 800px;
  margin: 0 auto;
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.feedback-title {
  font-size: 2rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.feedback-intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.intro-text {
  margin-top: 1rem;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  max-width: 600px;
}

.form-actions {
  display: flex;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .feedback-page {
    padding: 1rem;
  }

  .feedback-intro {
    padding: 1.5rem;
  }
}
</style>
