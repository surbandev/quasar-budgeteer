<template>
  <q-layout>
    <q-page-container>
      <q-page class="register-page flex flex-center">
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

        <div class="register-container" :class="{ 'form-step': step === 2 }">
          <!-- Step 1: Plan Selection -->
          <div v-if="step === 1" class="plan-selection-container">
            <h2 class="form-title">Create Account</h2>

            <div class="sign-in-link">
              Already have an account? <router-link to="/login">Sign in</router-link>
            </div>

            <div class="pricing-plans">
              <div
                class="plan-card"
                :class="{ active: selectedPlan === 'basic' }"
                @click="selectedPlan = 'basic'"
              >
                <h3 class="plan-name">Basic Plan</h3>
                <div class="plan-price">
                  <span class="price">$4.99</span>
                  <span class="period">/month</span>
                </div>
                <ul class="plan-features">
                  <li>✓ Up to 1 profile</li>
                  <li>✓ Basic calendar features</li>
                  <li>✓ Standard support</li>
                </ul>
              </div>

              <div
                class="plan-card premium"
                :class="{ active: selectedPlan === 'premium' }"
                @click="selectedPlan = 'premium'"
              >
                <div class="popular-badge">MOST POPULAR</div>
                <h3 class="plan-name">Premium Plan</h3>
                <div class="plan-price">
                  <span class="price">$9.99</span>
                  <span class="period">/month</span>
                </div>
                <ul class="plan-features">
                  <li>✓ Unlimited profiles</li>
                  <li>✓ Advanced calendar features</li>
                  <li>✓ Priority support</li>
                  <li>✓ Advanced analytics</li>
                </ul>
              </div>
            </div>

            <q-btn
              class="continue-button"
              @click="handleContinue"
              :disable="!selectedPlan"
              unelevated
              no-caps
            >
              CONTINUE WITH {{ selectedPlan === 'basic' ? 'BASIC' : 'PREMIUM' }} PLAN
            </q-btn>
          </div>

          <!-- Step 2: Registration Form -->
          <div v-else class="registration-form-container">
            <h2 class="form-title">Create Account</h2>

            <div class="sign-in-link-form">
              Already have an account? <router-link to="/login">Sign in</router-link>
            </div>

            <div class="step-indicators">
              <div class="step-item completed" @click="step = 1" style="cursor: pointer">
                <div class="step-circle">1</div>
                <div class="step-label">Choose Plan</div>
              </div>
              <div class="step-line"></div>
              <div class="step-item active">
                <div class="step-circle">2</div>
                <div class="step-label">Create Account</div>
              </div>
            </div>

            <q-form @submit="handleCreateAccount" class="registration-form">
              <div class="form-row">
                <div class="form-group">
                  <label>First Name</label>
                  <q-input
                    v-model="firstName"
                    type="text"
                    placeholder="Enter first name"
                    class="form-input"
                    borderless
                    dense
                  />
                </div>
                <div class="form-group">
                  <label>Last Name</label>
                  <q-input
                    v-model="lastName"
                    type="text"
                    placeholder="Enter last name"
                    class="form-input"
                    borderless
                    dense
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Username</label>
                  <q-input
                    v-model="username"
                    type="text"
                    placeholder="Choose username"
                    class="form-input"
                    borderless
                    dense
                  />
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <q-input
                    v-model="email"
                    type="email"
                    placeholder="Enter email"
                    class="form-input"
                    borderless
                    dense
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Phone Number</label>
                  <q-input
                    v-model="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    class="form-input"
                    borderless
                    dense
                  />
                </div>
                <div class="form-group">
                  <label>Password</label>
                  <q-input
                    v-model="password"
                    type="password"
                    placeholder="Enter password"
                    class="form-input"
                    borderless
                    dense
                  />
                </div>
              </div>

              <div class="form-group full-width">
                <label>Confirm Password</label>
                <q-input
                  v-model="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  class="form-input"
                  borderless
                  dense
                />
              </div>

              <q-btn
                type="submit"
                class="create-account-button"
                :loading="isLoading"
                :disable="isLoading"
                unelevated
                no-caps
              >
                {{ isLoading ? 'CREATING...' : 'CREATE ACCOUNT' }}
              </q-btn>
            </q-form>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const step = ref(1)
const selectedPlan = ref('basic')
const firstName = ref('')
const lastName = ref('')
const username = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)

function handleContinue() {
  step.value = 2
}

function handleCreateAccount() {
  // TODO: Implement account creation with API call
  isLoading.value = true

  setTimeout(() => {
    $q.notify({
      type: 'positive',
      message: 'Account created successfully!',
      position: 'top',
    })
    isLoading.value = false
  }, 1000)
}
</script>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
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

.app-title-container {
  position: absolute;
  top: 3%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 1;
  padding-top: 2rem;
  margin-bottom: 2rem;
  animation: fadeInDown 1s ease-out;
  width: 100%;
}

.app-title {
  font-size: 8rem;
  font-weight: 900;
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
  margin: 0 0 2rem 0;
  letter-spacing: 6px;
  position: relative;
  z-index: 10;
  animation: glow 2s ease-in-out infinite alternate;
  padding-bottom: 2rem;
  line-height: 1.1;
}

.app-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 6px;
  background: linear-gradient(
    90deg,
    transparent,
    #667eea,
    #764ba2,
    #f093fb,
    #f5576c,
    #4facfe,
    transparent
  );
  border-radius: 3px;
  animation: shimmer 3s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
}

@keyframes glow {
  from {
    filter: drop-shadow(0 0 20px rgba(102, 126, 234, 0.3));
  }
  to {
    filter: drop-shadow(0 0 30px rgba(102, 126, 234, 0.6));
  }
}

@keyframes shimmer {
  0%,
  100% {
    opacity: 0.6;
    transform: translateX(-50%) scaleX(0.8);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) scaleX(1.2);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.title-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 1.5rem;
  font-weight: 300;
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: 0.9;
  animation: fadeInUp 1s ease-out 0.5s both;
}

.beta-badge {
  display: inline-block;
  margin-top: 0.3rem;
  margin-bottom: 0;
  padding: 0.1rem 0;
  animation: fadeInUp 1s ease-out 0.7s both;
}

.beta-text {
  display: inline-block;
  background: linear-gradient(
    135deg,
    #ff6b6b 0%,
    #9c27b0 25%,
    #673ab7 50%,
    #3f51b5 75%,
    #2196f3 100%
  );
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  text-transform: uppercase;
  box-shadow:
    0 4px 15px rgba(156, 39, 176, 0.4),
    0 0 20px rgba(156, 39, 176, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
  animation: betaPulse 2s ease-in-out infinite;
}

.beta-text::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: betaShimmer 3s ease-in-out infinite;
}

@keyframes betaPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow:
      0 4px 15px rgba(156, 39, 176, 0.4),
      0 0 20px rgba(156, 39, 176, 0.2);
  }
  50% {
    transform: scale(1.05);
    box-shadow:
      0 6px 20px rgba(156, 39, 176, 0.6),
      0 0 30px rgba(156, 39, 176, 0.4);
  }
}

@keyframes betaShimmer {
  0% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
  100% {
    left: 100%;
  }
}

.register-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  max-width: 850px;
  width: 100%;
  margin: 8rem auto 2rem;
  padding: 0 2rem;
  overflow: visible;
  z-index: 2;
}

/* When showing registration form (step 2), reduce top margin */
.register-container.form-step {
  margin-top: 3rem;
}

.plan-selection-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sign-in-link {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  text-align: center;
  margin-bottom: 3rem;
}

.sign-in-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.sign-in-link a:hover {
  color: #764ba2;
}

/* Hide sign-in link on step 1 (plan selection) */
.sign-in-link:first-child {
  margin-bottom: 2rem;
}

.sign-in-link-form {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  text-align: center;
  margin-bottom: 2rem;
}

.sign-in-link-form a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.sign-in-link-form a:hover {
  color: #764ba2;
}

.pricing-plans {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  width: 100%;
  margin-bottom: 2rem;
}

.plan-card {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.plan-card:hover {
  transform: translateY(-5px);
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.plan-card.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
}

.plan-card.premium {
  border-color: rgba(236, 72, 153, 0.3);
}

.plan-card.premium.active {
  border-color: #ec4899;
  background: rgba(236, 72, 153, 0.1);
}

.popular-badge {
  position: absolute;
  top: -12px;
  right: 20px;
  background: linear-gradient(135deg, #ec4899 0%, #f093fb 100%);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  letter-spacing: 1px;
}

.plan-name {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
}

.plan-price {
  margin-bottom: 2rem;
}

.price {
  color: #667eea;
  font-size: 2.5rem;
  font-weight: 700;
}

.plan-card.premium .price {
  color: #ec4899;
}

.period {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  margin-left: 0.5rem;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.plan-features li {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  padding-left: 0.5rem;
}

.continue-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  height: 56px;
  font-weight: 600;
  border-radius: 12px;
  font-size: 1.1rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  width: 100%;
  max-width: 500px;
  letter-spacing: 1px;
}

/* Override Quasar button styles for continue button */
.continue-button.q-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  height: 56px;
  font-weight: 600;
  border-radius: 12px;
  font-size: 1.1rem;
  padding: 0;
  letter-spacing: 1px;
}

.continue-button.q-btn :deep(.q-btn__content) {
  font-weight: 600;
  font-size: 1.1rem;
}

.continue-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.continue-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Step 2: Registration Form */
.registration-form-container {
  width: 100%;
  max-width: 800px;
}

.form-title {
  color: white;
  font-size: 3.5rem;
  font-weight: 700;
  margin: 0 0 0 0;
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

.step-indicators {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin-bottom: 3rem;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.step-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.1);
  border: 3px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.5);
}

.step-item.completed .step-circle {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  border-color: #4caf50;
  color: white;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
}

.step-item.active .step-circle {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.step-item.completed {
  cursor: pointer;
  transition: all 0.3s ease;
}

.step-item.completed:hover .step-circle {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.5);
}

.step-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
}

.step-line {
  width: 120px;
  height: 3px;
  background: linear-gradient(90deg, #4caf50 0%, rgba(255, 255, 255, 0.3) 100%);
  margin: 0 1.5rem;
  top: 30px;
  position: relative;
}

.registration-form {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
}

/* Override Quasar input styles for registration form */
.form-input {
  width: 100%;
}

.form-input :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 14px 16px;
  min-height: 50px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.form-input :deep(.q-field__control):before,
.form-input :deep(.q-field__control):after {
  display: none;
}

.form-input :deep(.q-field__native) {
  color: white;
  font-size: 1rem;
  padding: 0;
  min-height: auto;
  line-height: 1.5;
}

.form-input :deep(.q-field__native)::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.form-input :deep(.q-field__control):hover {
  border-color: rgba(255, 255, 255, 0.6);
}

.form-input.q-field--focused :deep(.q-field__control) {
  border-color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.create-account-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  height: 56px;
  font-weight: 600;
  border-radius: 12px;
  font-size: 1.1rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  width: 100%;
  margin-top: 2rem;
  letter-spacing: 1px;
}

/* Override Quasar button styles for create account */
.create-account-button.q-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  height: 56px;
  font-weight: 600;
  border-radius: 12px;
  font-size: 1.1rem;
  padding: 0;
  letter-spacing: 1px;
}

.create-account-button.q-btn :deep(.q-btn__content) {
  font-weight: 600;
  font-size: 1.1rem;
}

.create-account-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.create-account-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .step-line {
    width: 50px;
  }
}

@media (max-width: 768px) {
  .app-title {
    font-size: 6rem;
    letter-spacing: 4px;
  }

  .title-subtitle {
    font-size: 1rem;
  }

  .beta-text {
    font-size: 0.7rem;
  }

  .equation {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 4.5rem;
    letter-spacing: 2px;
  }

  .beta-text {
    font-size: 0.65rem;
    padding: 0.25rem 0.7rem;
  }

  .equation {
    font-size: 0.9rem;
  }

  .register-card {
    margin: 5rem 1rem 0;
  }
}
</style>
