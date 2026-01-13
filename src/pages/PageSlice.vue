<template>
  <q-page
    class="slice-page"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseEnd"
  >
    <!-- Background with sliding bill amounts -->
    <div class="background-scene">
      <div class="bills-sliding">
        <div
          v-for="(bill, index) in slidingBills"
          :key="`${bill.id}-${index}`"
          :ref="(el) => setBillRef(el, index)"
          class="bill-item"
          :class="[`bill-${index + 1}`, { caught: bill.caught, 'slide-out': bill.slideOut }]"
        >
          {{ bill.name }}: {{ formatCurrency(bill.amount) }}
        </div>
      </div>

      <!-- Swipe trail SVG -->
      <svg class="swipe-trail" v-if="swipePoints.length > 1">
        <path
          :d="swipePathData"
          stroke="white"
          stroke-width="3"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="swipe-path"
        />
      </svg>
    </div>

    <div class="slice-container">
      <!-- Stats without boxes -->
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-label bills-label">Bills</div>
          <div class="stat-amount bills-amount">{{ formatCurrency(gameBills) }}</div>
        </div>

        <div class="stat-item">
          <div class="stat-label savings-label">Money Saved</div>
          <div class="stat-amount savings-amount">{{ formatCurrency(gameSavings) }}</div>
        </div>
      </div>

      <!-- Game Over / Victory Screen -->
      <div v-if="gameOver" class="game-over-screen">
        <div class="game-over-content">
          <h2 v-if="gameWon" class="victory-title">Level {{ currentLevel - 1 }} Complete!</h2>
          <h2 v-else class="defeat-title">Time's Up!</h2>
          <p class="game-stats">You saved {{ formatCurrency(gameSavings) }}</p>
          <p class="game-stats" v-if="!gameWon">
            Bills target: {{ formatCurrency(gameBills) }}
          </p>
          <div class="button-group">
            <q-btn
              v-if="gameWon && currentLevel === 2"
              @click="continueToNextLevel"
              label="Level 2"
              class="next-level-btn"
            />
            <q-btn @click="restartGame" label="Play Again" class="restart-btn" />
          </div>
        </div>
      </div>

      <q-inner-loading :showing="loading" />
    </div>

    <!-- Timer at bottom -->
    <div class="timer-container-bottom">
      <div class="timer-bar">
        <div class="timer-fill" :style="{ width: `${timerPercentage}%` }"></div>
        <div class="timer-text">{{ timeLeft }}s</div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEventsStore } from '../stores/events'

const eventsStore = useEventsStore()

const loading = ref(false)

// Game state
const gameBills = ref(0)
const gameSavings = ref(0)
const timeLeft = ref(30)
const gameOver = ref(false)
const gameWon = ref(false)
const timerInterval = ref(null)
const currentLevel = ref(1)

// Touch/swipe tracking
const isSwiping = ref(false)
const swipePoints = ref([])

// Bill refs
const billRefs = ref([])

// Get current month's events
const filteredEvents = computed(() => eventsStore.filteredEvents || [])

// Calculate initial total bills based on level
const initialBills = computed(() => {
  if (!filteredEvents.value || !Array.isArray(filteredEvents.value)) return 0

  const baseBills = filteredEvents.value
    .filter((event) => event.type === 'DEBIT' && event.category !== 'SAVINGS')
    .reduce((total, event) => {
      const amount = getEventDisplayAmount(event)
      return total + parseFloat(amount || 0)
    }, 0)

  // Level 1: 1 month of bills, Level 2+: 2 months of bills
  return currentLevel.value === 1 ? baseBills : baseBills * 2
})

// Timer percentage for progress bar
const timerPercentage = computed(() => {
  return (timeLeft.value / 30) * 100
})

// Generate SVG path data from swipe points
const swipePathData = computed(() => {
  if (swipePoints.value.length < 2) return ''

  let path = `M ${swipePoints.value[0].x} ${swipePoints.value[0].y}`
  for (let i = 1; i < swipePoints.value.length; i++) {
    path += ` L ${swipePoints.value[i].x} ${swipePoints.value[i].y}`
  }
  return path
})

// Create array of bills to slide across screen - bills repeat indefinitely
const slidingBills = ref([])

function initializeSlidingBills() {
  if (!filteredEvents.value || !Array.isArray(filteredEvents.value)) {
    slidingBills.value = []
    return
  }

  const bills = filteredEvents.value
    .filter((event) => event.type === 'DEBIT' && event.category !== 'SAVINGS')
    .map((event, idx) => ({
      id: idx,
      name: event.name || 'Unnamed',
      amount: getEventDisplayAmount(event),
      caught: false,
      slideOut: false,
    }))

  // Create 8 bill slots that will cycle through bills
  if (bills.length === 0) {
    slidingBills.value = []
    return
  }

  const result = []
  let id = 0
  while (result.length < 8) {
    bills.forEach((bill) => {
      if (result.length < 8) {
        result.push({ ...bill, id: id++, originalIndex: bill.id })
      }
    })
  }
  slidingBills.value = result.slice(0, 8)
}

function getEventDisplayAmount(event) {
  // Check for loan categories first - use monthly_payment instead of total loan amount
  const loanCategories = ['MORTGAGE', 'GENERIC_LOAN', 'AUTO_LOAN']
  if (loanCategories.includes(event.category)) {
    if (event.monthly_payment && event.monthly_payment > 0) {
      if (event.category === 'MORTGAGE' && event.escrow && event.escrow > 0) {
        return parseFloat(event.monthly_payment) + parseFloat(event.escrow)
      }
      return parseFloat(event.monthly_payment)
    }
  }

  // For non-loan categories or loans without monthly_payment, use the regular amount
  return event.amount || 0
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Set bill ref
function setBillRef(el, index) {
  if (el) {
    billRefs.value[index] = el
  }
}

// Start game timer
function startTimer() {
  timerInterval.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      endGame(false)
    }
  }, 1000)
}

// End game
function endGame(won) {
  gameOver.value = true
  gameWon.value = won
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }

  // If won, advance to next level
  if (won && currentLevel.value === 1) {
    currentLevel.value = 2
  }
}

// Continue to next level
function continueToNextLevel() {
  gameBills.value = initialBills.value
  gameSavings.value = 0
  timeLeft.value = 30
  gameOver.value = false
  gameWon.value = false

  // Reinitialize bills
  initializeSlidingBills()

  startTimer()
}

// Restart game
function restartGame() {
  // Reset to level 1
  currentLevel.value = 1

  gameBills.value = initialBills.value
  gameSavings.value = 0
  timeLeft.value = 30
  gameOver.value = false
  gameWon.value = false

  // Reinitialize bills
  initializeSlidingBills()

  startTimer()
}

// Touch handlers
function handleTouchStart(e) {
  if (gameOver.value) return
  e.preventDefault()
  isSwiping.value = true
  swipePoints.value = [{ x: e.touches[0].clientX, y: e.touches[0].clientY }]
}

function handleTouchMove(e) {
  if (!isSwiping.value || gameOver.value) return
  e.preventDefault()
  swipePoints.value.push({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  checkCollisions(e.touches[0].clientX, e.touches[0].clientY)
}

function handleTouchEnd() {
  isSwiping.value = false
  swipePoints.value = []
}

// Mouse handlers for desktop
function handleMouseDown(e) {
  if (gameOver.value) return
  isSwiping.value = true
  swipePoints.value = [{ x: e.clientX, y: e.clientY }]
}

function handleMouseMove(e) {
  if (!isSwiping.value || gameOver.value) return
  swipePoints.value.push({ x: e.clientX, y: e.clientY })
  checkCollisions(e.clientX, e.clientY)
}

function handleMouseEnd() {
  isSwiping.value = false
  swipePoints.value = []
}

// Check collisions between swipe and bills
function checkCollisions(x, y) {
  slidingBills.value.forEach((bill, index) => {
    if (bill.caught || bill.slideOut) return

    const billEl = billRefs.value[index]
    if (!billEl) return

    const rect = billEl.getBoundingClientRect()

    // Check if swipe point intersects with bill element
    if (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    ) {
      catchBill(bill)
    }
  })
}

// Catch a bill
function catchBill(bill) {
  if (bill.caught) return

  bill.caught = true

  // Add to savings
  const amount = parseFloat(bill.amount)
  gameSavings.value += amount

  // Trigger slide-out animation after a brief delay
  setTimeout(() => {
    bill.slideOut = true

    // Respawn the bill after animation
    setTimeout(() => {
      respawnBill(bill)
    }, 500)
  }, 100)

  // Check win condition - saved enough to cover all bills
  if (gameSavings.value >= initialBills.value) {
    endGame(true)
  }
}

// Respawn a caught bill
function respawnBill(bill) {
  // Get all available bills
  const availableBills = filteredEvents.value
    .filter((event) => event.type === 'DEBIT' && event.category !== 'SAVINGS')
    .map((event) => ({
      name: event.name || 'Unnamed',
      amount: getEventDisplayAmount(event),
    }))

  if (availableBills.length === 0) return

  // Pick a random bill
  const randomBill = availableBills[Math.floor(Math.random() * availableBills.length)]

  // Reset the bill
  bill.name = randomBill.name
  bill.amount = randomBill.amount
  bill.caught = false
  bill.slideOut = false
}

onMounted(async () => {
  loading.value = true
  try {
    // Always load January expenses for level 1
    const currentYear = new Date().getFullYear()
    const januaryDate = new Date(currentYear, 0, 1) // January 1st of current year
    eventsStore.setCurrentDate(januaryDate)
    await eventsStore.fetchEventsForMonthByScenario()

    // Initialize game state
    gameBills.value = initialBills.value
    gameSavings.value = 0

    // Initialize sliding bills
    initializeSlidingBills()

    // Start timer
    startTimer()
  } catch (error) {
    console.error('Error loading slice data:', error)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})
</script>

<style scoped lang="scss">
.slice-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
  padding: 2rem 1rem;
}

.background-scene {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.bills-sliding {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.swipe-trail {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.swipe-path {
  opacity: 0.8;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.4));
  animation: swipeFade 0.5s ease-out forwards;
}

@keyframes swipeFade {
  0% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
  }
}

.bill-item {
  position: absolute;
  font-family: 'Arial', sans-serif;
  font-size: 1.1rem;
  font-weight: 500;
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
  white-space: nowrap;
  opacity: 0;
  text-shadow:
    0 0 30px rgba(102, 126, 234, 0.6),
    0 0 40px rgba(118, 75, 162, 0.4),
    0 0 50px rgba(240, 147, 251, 0.3);
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;

  &.caught {
    opacity: 1 !important;
    transform: scale(1.2);
  }

  &.slide-out {
    animation: slideOutFast 0.5s ease-out forwards;
  }
}

@keyframes slideOutFast {
  0% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 0;
    transform: scale(0.5) translateY(-100px);
  }
}

// Sliding animations with different patterns for each bill
.bill-1 {
  animation: slideLeftToRight1 5s linear infinite;
}

.bill-2 {
  animation: slideRightToLeft1 5.5s linear infinite 1s;
}

.bill-3 {
  animation: slideDiagonal1 4.5s linear infinite 2s;
}

.bill-4 {
  animation: slideTopToBottom1 5.2s linear infinite 3s;
}

.bill-5 {
  animation: slideLeftToRight2 4.2s linear infinite 1.5s;
}

.bill-6 {
  animation: slideDiagonal2 6s linear infinite 3.5s;
}

.bill-7 {
  animation: slideRightToLeft2 4.8s linear infinite 4.5s;
}

.bill-8 {
  animation: slideBottomToTop1 5.5s linear infinite 5s;
}

@keyframes slideLeftToRight1 {
  0% {
    left: -20%;
    top: 15%;
    opacity: 0;
    transform: rotate(-5deg);
  }
  10% {
    opacity: 0.7;
  }
  90% {
    opacity: 0.7;
  }
  100% {
    left: 120%;
    top: 20%;
    opacity: 0;
    transform: rotate(5deg);
  }
}

@keyframes slideLeftToRight2 {
  0% {
    left: -20%;
    top: 70%;
    opacity: 0;
    transform: rotate(3deg);
  }
  10% {
    opacity: 0.7;
  }
  90% {
    opacity: 0.7;
  }
  100% {
    left: 120%;
    top: 65%;
    opacity: 0;
    transform: rotate(-3deg);
  }
}

@keyframes slideRightToLeft1 {
  0% {
    right: -20%;
    top: 40%;
    opacity: 0;
    transform: rotate(5deg);
  }
  10% {
    opacity: 0.7;
  }
  90% {
    opacity: 0.7;
  }
  100% {
    right: 120%;
    top: 45%;
    opacity: 0;
    transform: rotate(-5deg);
  }
}

@keyframes slideRightToLeft2 {
  0% {
    right: -20%;
    top: 85%;
    opacity: 0;
    transform: rotate(-3deg);
  }
  10% {
    opacity: 0.7;
  }
  90% {
    opacity: 0.7;
  }
  100% {
    right: 120%;
    top: 80%;
    opacity: 0;
    transform: rotate(3deg);
  }
}

@keyframes slideTopToBottom1 {
  0% {
    left: 50%;
    top: -20%;
    opacity: 0;
    transform: translateX(-50%) rotate(-3deg);
  }
  10% {
    opacity: 0.7;
  }
  90% {
    opacity: 0.7;
  }
  100% {
    left: 55%;
    top: 120%;
    opacity: 0;
    transform: translateX(-50%) rotate(3deg);
  }
}

@keyframes slideBottomToTop1 {
  0% {
    left: 30%;
    bottom: -20%;
    opacity: 0;
    transform: rotate(3deg);
  }
  10% {
    opacity: 0.7;
  }
  90% {
    opacity: 0.7;
  }
  100% {
    left: 35%;
    bottom: 120%;
    opacity: 0;
    transform: rotate(-3deg);
  }
}

@keyframes slideDiagonal1 {
  0% {
    left: -20%;
    top: -20%;
    opacity: 0;
    transform: rotate(-10deg);
  }
  10% {
    opacity: 0.7;
  }
  90% {
    opacity: 0.7;
  }
  100% {
    left: 120%;
    top: 120%;
    opacity: 0;
    transform: rotate(10deg);
  }
}

@keyframes slideDiagonal2 {
  0% {
    right: -20%;
    bottom: -20%;
    opacity: 0;
    transform: rotate(10deg);
  }
  10% {
    opacity: 0.7;
  }
  90% {
    opacity: 0.7;
  }
  100% {
    right: 120%;
    bottom: 120%;
    opacity: 0;
    transform: rotate(-10deg);
  }
}

.slice-container {
  max-width: 800px;
  width: 100%;
  padding: 0 1rem;
  z-index: 2;
}

.stats-row {
  display: flex;
  gap: 5rem;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.stat-label {
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bills-label {
  color: #ef4444;
  text-shadow:
    0 0 15px rgba(239, 68, 68, 0.6),
    0 0 30px rgba(239, 68, 68, 0.4);
}

.savings-label {
  color: #22c55e;
  text-shadow:
    0 0 15px rgba(34, 197, 94, 0.6),
    0 0 30px rgba(34, 197, 94, 0.4);
}

.stat-amount {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.5px;
}

.bills-amount {
  color: #ef4444;
  text-shadow:
    0 0 20px rgba(239, 68, 68, 0.7),
    0 0 40px rgba(239, 68, 68, 0.5),
    0 0 60px rgba(239, 68, 68, 0.3);
}

.savings-amount {
  color: #22c55e;
  text-shadow:
    0 0 20px rgba(34, 197, 94, 0.7),
    0 0 40px rgba(34, 197, 94, 0.5),
    0 0 60px rgba(34, 197, 94, 0.3);
}

@media (max-width: 768px) {
  .slice-page {
    padding: 1.5rem 1rem;
  }

  .stats-row {
    gap: 3rem;
  }

  .stat-label {
    font-size: 0.95rem;
  }

  .stat-amount {
    font-size: 1.75rem;
  }

  .bill-item {
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .stats-row {
    gap: 2rem;
  }

  .stat-label {
    font-size: 0.85rem;
  }

  .stat-amount {
    font-size: 1.5rem;
  }

  .bill-item {
    font-size: 0.85rem;
  }
}

// Timer styles
.timer-container-bottom {
  position: fixed;
  bottom: 72px; // Above bottom navigation with separation
  left: 0;
  right: 0;
  padding: 1rem;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.5) 100%);
  z-index: 10;
}

@media (min-width: 1024px) {
  .timer-container-bottom {
    bottom: 1rem; // Some padding from bottom on desktop
  }
}

.timer-bar {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  height: 40px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  overflow: hidden;
  border: 2px solid rgba(147, 51, 234, 0.3);
}

.timer-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #9333ea 0%, #a855f7 50%, #c084fc 100%);
  transition: width 1s linear;
  box-shadow:
    0 0 20px rgba(147, 51, 234, 0.6),
    0 0 40px rgba(147, 51, 234, 0.4);
}

.timer-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.2rem;
  font-weight: 700;
  color: white;
  z-index: 1;
  text-shadow:
    0 0 10px rgba(0, 0, 0, 0.8),
    0 2px 4px rgba(0, 0, 0, 0.5);
}

// Game over screen
.game-over-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.game-over-content {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  padding: 3rem 2rem;
  border-radius: 20px;
  text-align: center;
  max-width: 500px;
  width: 90%;
  border: 2px solid rgba(147, 51, 234, 0.3);
  box-shadow:
    0 0 40px rgba(147, 51, 234, 0.4),
    0 0 80px rgba(147, 51, 234, 0.2);
}

.victory-title {
  font-size: 3rem;
  font-weight: 700;
  color: #22c55e;
  margin: 0 0 1.5rem 0;
  text-shadow:
    0 0 20px rgba(34, 197, 94, 0.7),
    0 0 40px rgba(34, 197, 94, 0.5);
}

.defeat-title {
  font-size: 3rem;
  font-weight: 700;
  color: #ef4444;
  margin: 0 0 1.5rem 0;
  text-shadow:
    0 0 20px rgba(239, 68, 68, 0.7),
    0 0 40px rgba(239, 68, 68, 0.5);
}

.game-stats {
  font-size: 1.3rem;
  color: white;
  margin: 0.75rem 0;
  font-weight: 500;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.next-level-btn,
.restart-btn {
  font-size: 1.1rem;
  padding: 0.75rem 2.5rem;
  color: white;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
}

.next-level-btn {
  background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
  box-shadow:
    0 0 20px rgba(34, 197, 94, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.3);

  &:hover {
    box-shadow:
      0 0 30px rgba(34, 197, 94, 0.7),
      0 6px 16px rgba(0, 0, 0, 0.4);
  }
}

.restart-btn {
  background: linear-gradient(90deg, #9333ea 0%, #a855f7 100%);
  box-shadow:
    0 0 20px rgba(147, 51, 234, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.3);

  &:hover {
    box-shadow:
      0 0 30px rgba(147, 51, 234, 0.7),
      0 6px 16px rgba(0, 0, 0, 0.4);
  }
}

@media (max-width: 768px) {
  .timer-bar {
    height: 35px;
  }

  .timer-text {
    font-size: 1rem;
  }

  .victory-title,
  .defeat-title {
    font-size: 2.5rem;
  }

  .game-stats {
    font-size: 1.1rem;
  }

  .game-over-content {
    padding: 2rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .timer-bar {
    height: 30px;
  }

  .timer-text {
    font-size: 0.9rem;
  }

  .victory-title,
  .defeat-title {
    font-size: 2rem;
  }

  .game-stats {
    font-size: 1rem;
  }

  .restart-btn {
    font-size: 1rem;
    padding: 0.6rem 2rem;
  }
}
</style>
