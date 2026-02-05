<template>
  <q-page class="weave-page" @click="flap" @touchstart.prevent="flap">
    <!-- Night sky background -->
    <div class="game-viewport">
      <div class="sky" :style="skyScrollStyle">
        <div class="sky-panel sky-panel-1"></div>
        <div class="sky-panel sky-panel-2"></div>
      </div>
      <div class="stars" :style="starsScrollStyle"></div>
      <div class="moon"></div>
      <div class="scroll-midground" :style="midgroundScrollStyle">
        <div class="midground-part">
          <div class="clouds">
            <div class="cloud cloud-1"></div>
            <div class="cloud cloud-2"></div>
            <div class="cloud cloud-3"></div>
          </div>
          <div class="city-silhouette"></div>
        </div>
        <div class="midground-part">
          <div class="clouds">
            <div class="cloud cloud-1"></div>
            <div class="cloud cloud-2"></div>
            <div class="cloud cloud-3"></div>
          </div>
          <div class="city-silhouette"></div>
        </div>
      </div>

      <!-- Pipes (each = one bill for the month) -->
      <div v-for="(pipe, index) in pipes" :key="index" class="pipe-pair" :style="pipeStyle(pipe)">
        <div class="pipe pipe-top"></div>
        <div class="pipe pipe-bottom"></div>
        <div
          v-if="pipe.billName != null"
          class="pipe-bill-label"
          :class="{ 'pipe-bill-label--passed': pipe.scored }"
        >
          <span class="pipe-bill-name">{{ pipe.billName }}</span>
          <span class="pipe-bill-amount">{{ formatCurrency(pipe.billAmount) }}</span>
        </div>
      </div>

      <!-- Shatter bursts when a bill is passed successfully -->
      <div
        v-for="burst in shatterBursts"
        :key="burst.id"
        class="shatter-burst"
        :style="{ left: burst.x + 'px', top: burst.y + 'px' }"
      >
        <div
          v-for="(shard, si) in burst.shards"
          :key="si"
          class="shatter-shard"
          :style="{
            '--end-x': shard.endX + 'px',
            '--end-y': shard.endY + 'px',
            '--rot': shard.rotation + 'deg',
            '--delay': shard.delay + 'ms',
          }"
        />
      </div>

      <!-- Bird -->
      <div
        class="bird"
        :class="[{ flapping: isFlapping }, 'bird-skin-' + birdSkins[selectedBirdIndex].id]"
        :style="birdStyle"
      >
        <div class="bird-body"></div>
        <div class="bird-wing"></div>
        <div class="bird-eye"></div>
      </div>

      <!-- Ground -->
      <div class="ground" :style="groundScrollStyle">
        <div class="ground-segment">
          <div class="ground-grass"></div>
          <div class="ground-stone"></div>
        </div>
        <div class="ground-segment">
          <div class="ground-grass"></div>
          <div class="ground-stone"></div>
        </div>
      </div>
    </div>

    <!-- Current score at top -->
    <div class="score-display-top">
      <span class="score-display-top-label">Current</span>
      <span class="score-display-top-value">{{ score }}</span>
      <span v-if="monthBills.length > 0" class="score-display-top-bills">
        {{ billsRemaining }} bill{{ billsRemaining !== 1 ? 's' : '' }} left
      </span>
    </div>

    <!-- Bird selector (far left) + Score (center) in brown dirt area at bottom -->
    <div class="score-display-bottom">
      <div class="bird-selector" @click.stop @touchstart.stop.prevent @touchend.stop>
        <q-btn
          flat
          dense
          round
          icon="chevron_left"
          class="bird-selector-btn"
          :disable="gameStarted"
          @click="prevBird"
          @touchend.stop.prevent="prevBird"
        />
        <div
          class="bird-preview"
          :class="'bird-skin-' + birdSkins[selectedBirdIndex].id"
          aria-label="Selected bird"
        >
          <div class="bird-preview-body"></div>
          <div class="bird-preview-wing"></div>
          <div class="bird-preview-eye"></div>
        </div>
        <q-btn
          flat
          dense
          round
          icon="chevron_right"
          class="bird-selector-btn"
          :disable="gameStarted"
          @click="nextBird"
          @touchend.stop.prevent="nextBird"
        />
      </div>
      <div class="score-number-wrap">
        <span class="score-number-label">Best</span>
        <span class="score-number">{{ bestScore }}</span>
      </div>
      <div class="month-tracker">
        <div class="month-tracker-label">Months</div>
        <div class="month-tracker-grid">
          <div
            v-for="(month, idx) in monthTracker"
            :key="idx"
            class="month-tracker-item"
            :class="{ 'month-tracker-item--completed': month.completed }"
          >
            <span class="month-tracker-month">{{ month.name }}</span>
            <span v-if="month.completed" class="month-tracker-cross">✕</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Game Over overlay - stop touch so Play Again works on mobile -->
    <div
      v-if="gameOver"
      class="game-over-overlay"
      @click.stop
      @touchstart.stop.prevent
      @touchend.stop.prevent
    >
      <div class="game-over-box" @click.stop @touchstart.stop @touchend.stop>
        <h2 class="game-over-title">Game Over</h2>
        <p class="game-over-score">Score: {{ score }}</p>
        <q-btn
          class="restart-btn"
          label="Play Again"
          @click="restart"
          @touchend.prevent="onRestartTouch"
        />
      </div>
    </div>

    <!-- Celebration: one month of bills down -->
    <Transition name="celebration-fade">
      <div v-if="showCelebration" class="celebration-overlay" @click.stop @touchstart.stop>
        <div class="celebration-box">
          <p class="celebration-text">One month of bills down!!</p>
        </div>
      </div>
    </Transition>

    <!-- Start prompt -->
    <Transition name="start-fade">
      <div v-if="showStartPrompt" class="start-prompt">
        <p>Tap or click to flap</p>
      </div>
    </Transition>

    <q-inner-loading :showing="loading" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEventsStore } from '../stores/events'

const eventsStore = useEventsStore()
const loading = ref(false)

const BIRD_X_PERCENT = 22
const GRAVITY = 0.1
const FLAP_STRENGTH = -1.5
const PIPE_SPEED_BASE = 3
const PIPE_SPEED_MAX = 12
const PIPE_SPEED_RAMP_PER_SEC = 0.05
const PIPE_GAP = 180
const PIPE_WIDTH = 70
const PIPE_SPAWN_INTERVAL_MIN = 2600
const PIPE_SPAWN_INTERVAL_MAX = 4500
const GROUND_TOP_PERCENT = 78

const gameOver = ref(false)
const score = ref(0) // Cumulative score across all months
const monthScore = ref(0) // Score for current month only (for completion check)
const bestScore = ref(0)
const birdY = ref(40)
const birdVelocity = ref(0)
const pipes = ref([])
const showStartPrompt = ref(true)
const isFlapping = ref(false)
const viewportWidth = ref(400)
const viewportHeight = ref(600)
const viewportTop = ref(0)
const viewportLeft = ref(0)
const scrollOffset = ref(0)
const gameStartTime = ref(0)
const nextBillIndex = ref(0)

const shatterBursts = ref([])
let shatterIdNext = 0

const showCelebration = ref(false)
const currentMonthDate = ref(null)
let celebrationTimeout = null
const completedMonths = ref(new Set())
const isAdvancingMonth = ref(false)

// Month bills from events (DEBIT, not SAVINGS, one month)
const filteredEvents = computed(() => eventsStore.filteredEvents || [])

const monthBills = computed(() => {
  if (!filteredEvents.value || !Array.isArray(filteredEvents.value)) return []
  return filteredEvents.value
    .filter((event) => event.type === 'DEBIT' && event.category !== 'SAVINGS')
    .map((event) => ({
      name: event.name || 'Unnamed',
      amount: getEventDisplayAmount(event),
    }))
})

function getEventDisplayAmount(event) {
  const loanCategories = ['MORTGAGE', 'GENERIC_LOAN', 'AUTO_LOAN']
  if (loanCategories.includes(event.category)) {
    if (event.monthly_payment && event.monthly_payment > 0) {
      if (event.category === 'MORTGAGE' && event.escrow && event.escrow > 0) {
        return parseFloat(event.monthly_payment) + parseFloat(event.escrow)
      }
      return parseFloat(event.monthly_payment)
    }
  }
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

const billsRemaining = computed(() => {
  const total = monthBills.value.length
  if (total === 0) return 0
  return Math.max(0, total - monthScore.value)
})

function createShards() {
  const count = 14
  const shards = []
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
    const dist = 90 + Math.random() * 55
    shards.push({
      endX: Math.cos(angle) * dist,
      endY: Math.sin(angle) * dist,
      rotation: (Math.random() - 0.5) * 360,
      delay: Math.floor(Math.random() * 80),
    })
  }
  return shards
}

function triggerShatterAt(x, y) {
  const id = ++shatterIdNext
  shatterBursts.value.push({
    id,
    x,
    y,
    shards: createShards(),
  })
  setTimeout(() => {
    shatterBursts.value = shatterBursts.value.filter((b) => b.id !== id)
  }, 550)
}

// Bird skins (inspired by Flappy Bird character select)
const birdSkins = [
  { id: 'yellow', name: 'Yellow' },
  { id: 'red', name: 'Red' },
  { id: 'blue', name: 'Blue' },
  { id: 'green', name: 'Green' },
  { id: 'purple', name: 'Purple' },
  { id: 'teal', name: 'Teal' },
]
const selectedBirdIndex = ref(0)

function prevBird() {
  if (gameStarted.value) return
  selectedBirdIndex.value = (selectedBirdIndex.value - 1 + birdSkins.length) % birdSkins.length
  saveSelectedBird()
}

function nextBird() {
  if (gameStarted.value) return
  selectedBirdIndex.value = (selectedBirdIndex.value + 1) % birdSkins.length
  saveSelectedBird()
}

function saveSelectedBird() {
  try {
    localStorage.setItem('weave-bird-index', String(selectedBirdIndex.value))
  } catch {
    // ignore localStorage errors
  }
}

function loadSelectedBird() {
  try {
    const s = localStorage.getItem('weave-bird-index')
    if (s != null) {
      const i = parseInt(s, 10)
      if (i >= 0 && i < birdSkins.length) selectedBirdIndex.value = i
    }
  } catch {
    // ignore localStorage errors
  }
}

function saveBestScore() {
  try {
    localStorage.setItem('weave-best-score', String(bestScore.value))
  } catch {
    // ignore localStorage errors
  }
}

function loadBestScore() {
  try {
    const s = localStorage.getItem('weave-best-score')
    if (s != null) {
      const n = parseInt(s, 10)
      if (n >= 0) bestScore.value = n
    }
  } catch {
    // ignore localStorage errors
  }
}

function saveCompletedMonths() {
  try {
    const monthsArray = Array.from(completedMonths.value)
    localStorage.setItem('weave-completed-months', JSON.stringify(monthsArray))
  } catch {
    // ignore localStorage errors
  }
}

function loadCompletedMonths() {
  try {
    const s = localStorage.getItem('weave-completed-months')
    if (s != null) {
      const monthsArray = JSON.parse(s)
      if (Array.isArray(monthsArray)) {
        completedMonths.value = new Set(monthsArray)
      }
    }
  } catch {
    // ignore localStorage errors
  }
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}`
}

function markMonthCompleted(date) {
  const key = getMonthKey(date)
  completedMonths.value.add(key)
  saveCompletedMonths()
}

const monthTracker = computed(() => {
  const months = []
  const currentYear = currentMonthDate.value?.getFullYear() || new Date().getFullYear()
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentYear, i, 1)
    const key = getMonthKey(date)
    months.push({
      month: i,
      name: date.toLocaleDateString('en-US', { month: 'short' }),
      completed: completedMonths.value.has(key),
    })
  }
  return months
})

let animationId = null
let pipeSpawnTimer = null
let resizeObserver = null
const gameStarted = ref(false)

const birdStyle = computed(() => ({
  left: `${BIRD_X_PERCENT}%`,
  top: `${birdY.value}%`,
  transform: `translate(-50%, -50%) rotate(${Math.min(Math.max(birdVelocity.value * 3, -25), 70)}deg)`,
}))

// Scroll styles for parallax / sense of movement
const skyScrollStyle = computed(() => {
  const px = -(scrollOffset.value % (viewportWidth.value || 400))
  return { transform: `translateX(${px}px)` }
})

const starsScrollStyle = computed(() => {
  const px = -(scrollOffset.value % 200)
  return { backgroundPositionX: `${px}px` }
})

const midgroundScrollStyle = computed(() => {
  const w = viewportWidth.value || 400
  const px = -(scrollOffset.value % w)
  return { transform: `translateX(${px}px)` }
})

const groundScrollStyle = computed(() => {
  const w = viewportWidth.value || 400
  const px = -(scrollOffset.value % w)
  return { transform: `translateX(${px}px)` }
})

function pipeStyle(pipe) {
  const gapCenter = pipe.gapY
  const gapHalf = PIPE_GAP / 2
  return {
    '--pipe-x': `${pipe.x}px`,
    '--gap-top': `${gapCenter - gapHalf}px`,
    '--gap-bottom': `${gapCenter + gapHalf}px`,
    '--gap-center-y': `${gapCenter}px`,
    '--pipe-width': `${PIPE_WIDTH}px`,
  }
}

function flap(e) {
  if (gameOver.value) return
  e?.preventDefault?.()
  if (!gameStarted.value) {
    gameStarted.value = true
    gameStartTime.value = Date.now()
    showStartPrompt.value = false
    birdVelocity.value = FLAP_STRENGTH
    startPipeSpawning()
    return
  }
  isFlapping.value = true
  birdVelocity.value = FLAP_STRENGTH
  setTimeout(() => {
    isFlapping.value = false
  }, 120)
}

function spawnPipe() {
  if (gameOver.value || !gameStarted.value) return
  const h = viewportHeight.value
  const groundTopPx = h * (GROUND_TOP_PERCENT / 100)
  const minGapY = PIPE_GAP / 2 + 80
  const maxGapY = groundTopPx - PIPE_GAP / 2 - 40
  if (maxGapY <= minGapY) return
  const gapY = minGapY + Math.random() * (maxGapY - minGapY)

  const bills = monthBills.value
  if (bills.length > 0 && nextBillIndex.value < bills.length) {
    const bill = bills[nextBillIndex.value]
    pipes.value.push({
      x: viewportWidth.value + PIPE_WIDTH,
      gapY,
      scored: false,
      billName: bill.name,
      billAmount: bill.amount,
      billIndex: nextBillIndex.value,
    })
    nextBillIndex.value += 1
  } else if (bills.length === 0) {
    pipes.value.push({
      x: viewportWidth.value + PIPE_WIDTH,
      gapY,
      scored: false,
      billName: null,
      billAmount: null,
      billIndex: null,
    })
  }
}

// Slightly smaller hitbox than visual (36px bird) for fairer collision
const BIRD_COLLISION_RADIUS = 14
// Extra margin so gap is treated as larger (forgiveness for pipe caps / near-misses)
const GAP_COLLISION_MARGIN = 10

function checkCollision() {
  const birdCenterX = (viewportWidth.value * BIRD_X_PERCENT) / 100
  const birdCenterY = (viewportHeight.value * birdY.value) / 100
  const r = BIRD_COLLISION_RADIUS
  const groundTop = viewportHeight.value * (GROUND_TOP_PERCENT / 100)

  if (birdCenterY - r <= 0 || birdCenterY + r >= groundTop) {
    return true
  }

  const gapHalf = PIPE_GAP / 2 + GAP_COLLISION_MARGIN
  for (const pipe of pipes.value) {
    const pipeLeft = pipe.x - PIPE_WIDTH / 2
    const pipeRight = pipe.x + PIPE_WIDTH / 2
    if (birdCenterX + r < pipeLeft || birdCenterX - r > pipeRight) continue
    if (birdCenterY - r < pipe.gapY - gapHalf || birdCenterY + r > pipe.gapY + gapHalf) {
      return true
    }
  }
  return false
}

function gameLoop() {
  if (gameOver.value) return

  if (gameStarted.value) {
    const elapsedSec = (Date.now() - gameStartTime.value) / 1000
    const speed = Math.min(PIPE_SPEED_MAX, PIPE_SPEED_BASE + elapsedSec * PIPE_SPEED_RAMP_PER_SEC)

    birdVelocity.value += GRAVITY
    birdY.value += birdVelocity.value * 0.35
    scrollOffset.value += speed

    pipes.value = pipes.value
      .map((p) => {
        const next = { ...p, x: p.x - speed }
        if (!p.scored && next.x < viewportWidth.value * (BIRD_X_PERCENT / 100)) {
          next.scored = true
          score.value += 1
          monthScore.value += 1
          if (score.value > bestScore.value) {
            bestScore.value = score.value
            saveBestScore()
          }
          const centerX = viewportLeft.value + next.x + PIPE_WIDTH / 2
          const centerY = viewportTop.value + p.gapY
          triggerShatterAt(centerX, centerY)
        }
        return next
      })
      .filter((p) => p.x > -PIPE_WIDTH - 20)

    if (
      monthBills.value.length > 0 &&
      monthScore.value >= monthBills.value.length &&
      monthScore.value > 0 &&
      !showCelebration.value &&
      !isAdvancingMonth.value &&
      currentMonthDate.value &&
      gameStarted.value
    ) {
      showCelebration.value = true
      isAdvancingMonth.value = true
      markMonthCompleted(currentMonthDate.value)
      if (celebrationTimeout) clearTimeout(celebrationTimeout)
      celebrationTimeout = setTimeout(() => {
        showCelebration.value = false
        advanceToNextMonth()
      }, 3000)
    }

    if (checkCollision()) {
      gameOver.value = true
      return
    }
  }

  animationId = requestAnimationFrame(gameLoop)
}

function measureViewport() {
  const el = document.querySelector('.weave-page')
  if (el) {
    viewportWidth.value = el.clientWidth
    viewportHeight.value = el.clientHeight
  }
  const gameEl = document.querySelector('.game-viewport')
  if (gameEl) {
    const rect = gameEl.getBoundingClientRect()
    viewportTop.value = rect.top
    viewportLeft.value = rect.left
  }
}

function scheduleNextPipe() {
  if (gameOver.value || !gameStarted.value) return
  const bills = monthBills.value
  const hasMoreBills = bills.length > 0 && nextBillIndex.value < bills.length
  const useRandomPipes = bills.length === 0
  if (!hasMoreBills && !useRandomPipes) return

  const delay =
    PIPE_SPAWN_INTERVAL_MIN + Math.random() * (PIPE_SPAWN_INTERVAL_MAX - PIPE_SPAWN_INTERVAL_MIN)
  pipeSpawnTimer = setTimeout(() => {
    spawnPipe()
    scheduleNextPipe()
  }, delay)
}

function startPipeSpawning() {
  scheduleNextPipe()
}

async function advanceToNextMonth() {
  // Prevent multiple calls - if flag is already false, we've already advanced
  if (!isAdvancingMonth.value) {
    return
  }

  if (celebrationTimeout) {
    clearTimeout(celebrationTimeout)
    celebrationTimeout = null
  }
  showCelebration.value = false

  if (!currentMonthDate.value) {
    isAdvancingMonth.value = false
    return
  }
  const d = currentMonthDate.value
  const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  currentMonthDate.value = nextMonth

  try {
    eventsStore.setCurrentDate(nextMonth)
    await eventsStore.fetchEventsForMonthByScenario()
  } catch (err) {
    console.error('Error loading next month:', err)
  }

  // Reset month score for the new month, but keep cumulative score
  monthScore.value = 0
  nextBillIndex.value = 0
  pipes.value = []
  if (pipeSpawnTimer) {
    clearTimeout(pipeSpawnTimer)
    pipeSpawnTimer = null
  }
  isAdvancingMonth.value = false
  startPipeSpawning()
}

function restart() {
  gameOver.value = false
  score.value = 0
  monthScore.value = 0
  birdY.value = 40
  birdVelocity.value = 0
  scrollOffset.value = 0
  gameStartTime.value = 0
  pipes.value = []
  nextBillIndex.value = 0
  showCelebration.value = false
  isAdvancingMonth.value = false
  if (celebrationTimeout) {
    clearTimeout(celebrationTimeout)
    celebrationTimeout = null
  }
  const currentYear = new Date().getFullYear()
  currentMonthDate.value = new Date(currentYear, 0, 1)
  showStartPrompt.value = true
  gameStarted.value = false
  if (pipeSpawnTimer) {
    clearTimeout(pipeSpawnTimer)
    pipeSpawnTimer = null
  }
  eventsStore.setCurrentDate(currentMonthDate.value)
  eventsStore
    .fetchEventsForMonthByScenario()
    .catch((err) => console.error('Error loading month:', err))
  animationId = requestAnimationFrame(gameLoop)
}

// Mobile: ensure restart fires on touch (touchend) since click can be delayed or swallowed
function onRestartTouch() {
  restart()
}

onMounted(async () => {
  loadSelectedBird()
  loadBestScore()
  loadCompletedMonths()
  measureViewport()
  resizeObserver = new ResizeObserver(measureViewport)
  const el = document.querySelector('.weave-page')
  if (el) resizeObserver.observe(el)
  animationId = requestAnimationFrame(gameLoop)

  loading.value = true
  try {
    const currentYear = new Date().getFullYear()
    const januaryDate = new Date(currentYear, 0, 1)
    currentMonthDate.value = januaryDate
    eventsStore.setCurrentDate(januaryDate)
    await eventsStore.fetchEventsForMonthByScenario()
  } catch (err) {
    console.error('Error loading Weave bill data:', err)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (celebrationTimeout) clearTimeout(celebrationTimeout)
  if (animationId) cancelAnimationFrame(animationId)
  if (pipeSpawnTimer) clearTimeout(pipeSpawnTimer)
  resizeObserver?.disconnect?.()
})
</script>

<style scoped lang="scss">
.weave-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: #0d0d0d;
  padding: 0;
}

.game-viewport {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

// Night sky - two panels for seamless horizontal scroll
.sky {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 200%;
  display: flex;
  z-index: 0;
}

.sky-panel {
  flex: 0 0 50%;
  height: 100%;
  background: linear-gradient(180deg, #1a0a2e 0%, #2d1b4e 35%, #3d2a5c 60%, #2d3a5c 100%);
}

.stars {
  position: absolute;
  inset: 0;
  left: 0;
  width: 100%;
  background-image:
    radial-gradient(2px 2px at 20px 30px, #fff, transparent),
    radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(2px 2px at 50px 160px, #fff, transparent),
    radial-gradient(2px 2px at 90px 40px, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(2px 2px at 130px 80px, #fff, transparent),
    radial-gradient(2px 2px at 160px 120px, rgba(255, 255, 255, 0.9), transparent);
  background-size: 200px 200px;
  background-repeat: repeat-x;
  opacity: 0.9;
  z-index: 1;
}

.moon {
  position: absolute;
  top: 12%;
  left: 15%;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #f4f1de, #c9c3a0 40%, #8b8680);
  box-shadow:
    inset -15px -10px 0 0 #2d2a26,
    0 0 40px rgba(244, 241, 222, 0.5);
  z-index: 2;
}

.scroll-midground {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 200%;
  display: flex;
  z-index: 1;
  pointer-events: none;
}

.scroll-midground .clouds {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.scroll-midground .city-silhouette {
  position: absolute;
}

.cloud {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(180deg, rgba(100, 180, 200, 0.4) 0%, rgba(60, 120, 140, 0.3) 100%);
  filter: blur(1px);
}

.scroll-midground .cloud-1 {
  width: 120px;
  height: 40px;
  top: 25%;
  left: 10%;
  box-shadow: 40px 0 0 -10px rgba(100, 180, 200, 0.3);
}
.scroll-midground .cloud-2 {
  width: 100px;
  height: 35px;
  top: 45%;
  left: 35%;
  box-shadow: 35px 0 0 -8px rgba(100, 180, 200, 0.25);
}
.scroll-midground .cloud-3 {
  width: 80px;
  height: 28px;
  top: 18%;
  left: 55%;
  box-shadow: 30px 0 0 -5px rgba(100, 180, 200, 0.2);
}

.city-silhouette {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 35%;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(20, 15, 40, 0.6) 30%,
    rgba(15, 12, 35, 0.9) 100%
  );
  clip-path: polygon(
    0% 100%,
    0% 60%,
    5% 65%,
    8% 45%,
    12% 70%,
    18% 40%,
    22% 55%,
    28% 35%,
    35% 60%,
    42% 30%,
    48% 50%,
    55% 25%,
    62% 45%,
    70% 20%,
    78% 50%,
    85% 35%,
    92% 55%,
    98% 40%,
    100% 60%,
    100% 100%
  );
}

.midground-part {
  position: relative;
  flex: 0 0 50%;
  height: 100%;
}

.midground-part .clouds {
  width: 100%;
}

// Pipes
.pipe-pair {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: var(--pipe-width);
  transform: translateX(var(--pipe-x));
  z-index: 3;
  pointer-events: none;
  overflow: visible;
}

.pipe {
  position: absolute;
  left: 0;
  width: 100%;
  z-index: 1;
  background: linear-gradient(90deg, #7cb342 0%, #8bc34a 25%, #689f38 70%, #558b2f 100%);
  border: 3px solid #5d8a2a;
  border-radius: 4px;
  box-shadow:
    inset 4px 0 0 rgba(255, 255, 255, 0.25),
    inset -2px 0 0 rgba(0, 0, 0, 0.2);
}

.pipe::after {
  content: '';
  position: absolute;
  left: -2px;
  right: -2px;
  height: 18px;
  background: linear-gradient(90deg, #8bc34a 0%, #9ccc65 50%, #7cb342 100%);
  border: 2px solid #5d8a2a;
  border-radius: 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.pipe-top {
  top: 0;
  height: var(--gap-top);
}

.pipe-top::after {
  bottom: -18px;
}

.pipe-bottom {
  top: var(--gap-bottom);
  bottom: calc(22% + 2px);
}

.pipe-bottom::after {
  top: -18px;
}

.pipe-bill-label {
  position: absolute;
  left: 50%;
  top: var(--gap-center-y);
  transform: translate(-50%, -50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  pointer-events: none;
  max-width: calc(var(--pipe-width) + 24px);
  padding: 0.35rem 6px;
  transition: opacity 0.2s ease;
}

.pipe-bill-label--passed {
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}

.pipe-bill-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  text-align: center;
  line-height: 1.15;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 1),
    0 0 8px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.pipe-bill-amount {
  font-size: 0.8rem;
  font-weight: 600;
  color: #b8e6b8;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 1),
    0 0 6px rgba(0, 0, 0, 0.7);
}

// Shatter effect when a bill is passed
.shatter-burst {
  position: fixed;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 6;
  transform: translate(-50%, -50%);
}

.shatter-shard {
  position: absolute;
  left: 0;
  top: 0;
  width: 16px;
  height: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 30%, #f093fb 60%, #f5576c 100%);
  border-radius: 2px;
  box-shadow:
    0 0 12px rgba(102, 126, 234, 0.8),
    0 0 18px rgba(240, 147, 251, 0.5);
  animation: shardFly 0.5s ease-out var(--delay, 0ms) forwards;
  opacity: 0;
  transform: translate(0, 0) rotate(0deg) scale(1);
}

@keyframes shardFly {
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--end-x), var(--end-y)) rotate(var(--rot)) scale(0.2);
  }
}

// Bird
.bird {
  position: absolute;
  width: 36px;
  height: 36px;
  z-index: 5;
  transition: transform 0.08s ease-out;
  pointer-events: none;
}

.bird-body {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffeb3b 0%, #ffc107 40%, #ff9800 100%);
  border: 2px solid #f57c00;
  box-shadow:
    inset 2px 2px 0 rgba(255, 255, 255, 0.4),
    -1px -1px 0 rgba(0, 0, 0, 0.15);
}

.bird-body::before {
  content: '';
  position: absolute;
  right: -11px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 12px solid #ff9800;
  border-right: none;
}

.bird-wing {
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 12px;
  background: rgba(255, 235, 59, 0.9);
  border-radius: 50%;
  border: 1px solid #f57c00;
  transform-origin: right center;
  transition: transform 0.12s ease-out;
}

.bird.flapping .bird-wing {
  transform: translateY(-50%) rotate(-35deg) scaleX(1.2);
}

.bird-eye {
  position: absolute;
  right: 4px;
  top: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #000;
  z-index: 2;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.bird-eye::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #fff;
}

// Bird skin variants (game bird + preview)
.bird-skin-red .bird-body,
.bird-skin-red .bird-preview-body {
  background: linear-gradient(135deg, #ffcdd2 0%, #ef5350 40%, #c62828 100%);
  border-color: #b71c1c;
}
.bird-skin-red .bird-body::before,
.bird-skin-red .bird-preview-body::before {
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 12px solid #c62828;
  border-right: none;
}
.bird-skin-red .bird-wing,
.bird-skin-red .bird-preview-wing {
  background: rgba(239, 83, 80, 0.95);
  border-color: #b71c1c;
}

.bird-skin-blue .bird-body,
.bird-skin-blue .bird-preview-body {
  background: linear-gradient(135deg, #bbdefb 0%, #2196f3 40%, #1565c0 100%);
  border-color: #0d47a1;
}
.bird-skin-blue .bird-body::before,
.bird-skin-blue .bird-preview-body::before {
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 12px solid #1565c0;
  border-right: none;
}
.bird-skin-blue .bird-wing,
.bird-skin-blue .bird-preview-wing {
  background: rgba(33, 150, 243, 0.95);
  border-color: #0d47a1;
}

.bird-skin-green .bird-body,
.bird-skin-green .bird-preview-body {
  background: linear-gradient(135deg, #c8e6c9 0%, #66bb6a 40%, #2e7d32 100%);
  border-color: #1b5e20;
}
.bird-skin-green .bird-body::before,
.bird-skin-green .bird-preview-body::before {
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 12px solid #2e7d32;
  border-right: none;
}
.bird-skin-green .bird-wing,
.bird-skin-green .bird-preview-wing {
  background: rgba(102, 187, 106, 0.95);
  border-color: #1b5e20;
}

.bird-skin-purple .bird-body,
.bird-skin-purple .bird-preview-body {
  background: linear-gradient(135deg, #e1bee7 0%, #9c27b0 40%, #6a1b9a 100%);
  border-color: #4a148c;
}
.bird-skin-purple .bird-body::before,
.bird-skin-purple .bird-preview-body::before {
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 12px solid #6a1b9a;
  border-right: none;
}
.bird-skin-purple .bird-wing,
.bird-skin-purple .bird-preview-wing {
  background: rgba(156, 39, 176, 0.95);
  border-color: #4a148c;
}

.bird-skin-teal .bird-body,
.bird-skin-teal .bird-preview-body {
  background: linear-gradient(135deg, #b2dfdb 0%, #009688 40%, #00695c 100%);
  border-color: #004d40;
}
.bird-skin-teal .bird-body::before,
.bird-skin-teal .bird-preview-body::before {
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 12px solid #00695c;
  border-right: none;
}
.bird-skin-teal .bird-wing,
.bird-skin-teal .bird-preview-wing {
  background: rgba(0, 150, 136, 0.95);
  border-color: #004d40;
}

// Ground - two segments for seamless scroll
.ground {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 22%;
  width: 200%;
  display: flex;
  z-index: 2;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
}

.ground-segment {
  flex: 0 0 50%;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ground-grass {
  height: 28%;
  flex-shrink: 0;
  background: linear-gradient(180deg, #6b9b37 0%, #558b2f 30%, #33691e 100%);
  box-shadow:
    inset 0 3px 0 rgba(255, 255, 255, 0.15),
    0 2px 0 rgba(0, 0, 0, 0.2);
  border-bottom: 2px solid #2e5016;
}

.ground-stone {
  flex: 1;
  min-height: 0;
  background-color: #4e342e;
  box-shadow: inset 0 2px 0 rgba(0, 0, 0, 0.2);
}

// Current score at top (center), below the app header (~64px)
.score-display-top {
  position: fixed;
  top: 6rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

.score-display-top-label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.95;
  font-family: 'Courier New', monospace;
  text-shadow:
    2px 2px 0 rgba(0, 0, 0, 0.8),
    0 0 4px rgba(0, 0, 0, 0.9);
}

.score-display-top-value {
  font-size: clamp(1.75rem, 6vw, 2.5rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.02em;
  font-family: 'Courier New', monospace;
  text-shadow:
    3px 3px 0 rgba(0, 0, 0, 0.8),
    0 0 6px rgba(0, 0, 0, 0.9);
}

.score-display-top-bills {
  font-size: 0.7rem;
  font-weight: 800;
  opacity: 0.95;
  margin-top: 0.15rem;
  font-family: 'Courier New', monospace;
  text-shadow:
    1px 1px 0 rgba(0, 0, 0, 0.8),
    0 0 3px rgba(0, 0, 0, 0.9);
}

// Score + bird selector in brown dirt area at bottom - above bottom nav (~64px)
.score-display-bottom {
  position: fixed;
  bottom: calc(6.5rem - 2%);
  left: 0;
  right: 0;
  z-index: 11;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem;
  color: #f5ecd8;
  text-shadow:
    0 2px 6px rgba(0, 0, 0, 0.95),
    0 0 12px rgba(0, 0, 0, 0.6);
  gap: 0.5rem;
  max-width: 100%;
  overflow: hidden;
}

.bird-selector {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.score-number-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  min-width: 0;
  margin: 0;
  flex-shrink: 1;
}

.score-number-label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.9;
  font-family: 'Courier New', monospace;
  text-shadow:
    2px 2px 0 rgba(0, 0, 0, 0.8),
    0 0 4px rgba(0, 0, 0, 0.9);
}

.score-display-bottom .score-number {
  font-size: clamp(2.25rem, 11vw, 4rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.02em;
  font-family: 'Courier New', monospace;
  text-shadow:
    3px 3px 0 rgba(0, 0, 0, 0.8),
    0 0 6px rgba(0, 0, 0, 0.9);
}

.bird-selector-spacer {
  display: none;
}

.month-tracker {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  flex-shrink: 0;
  min-width: 0;
  margin-left: 0.25rem;
  margin-right: 0;
  max-width: 160px;
}

.month-tracker-label {
  font-size: 0.65rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #fff;
  text-shadow:
    2px 2px 0 rgba(0, 0, 0, 0.9),
    0 0 4px rgba(0, 0, 0, 0.95);
  font-family: 'Courier New', monospace;
  line-height: 1;
  margin-bottom: 0.1rem;
}

.month-tracker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.2rem;
  width: 100%;
  max-width: 155px;
  min-width: 130px;
  background: linear-gradient(135deg, rgba(60, 45, 30, 0.9) 0%, rgba(40, 30, 20, 0.95) 100%);
  border: 4px solid rgba(139, 195, 74, 0.4);
  border-radius: 0;
  padding: 0.45rem 0.4rem;
  box-shadow:
    inset 0 0 0 2px rgba(0, 0, 0, 0.8),
    inset 0 2px 4px rgba(0, 0, 0, 0.6),
    0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 12px rgba(139, 195, 74, 0.2);
  position: relative;
  box-sizing: border-box;
}

.month-tracker-grid::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid rgba(255, 255, 255, 0.1);
  pointer-events: none;
}

.month-tracker-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.25rem;
  font-size: 0.65rem;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.5);
  text-shadow:
    2px 2px 0 rgba(0, 0, 0, 0.95),
    0 0 4px rgba(0, 0, 0, 0.9);
  font-family: 'Courier New', monospace;
  line-height: 1;
  transition: all 0.15s ease;
  border-radius: 0;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
  min-height: 1.5rem;
  box-shadow:
    inset 0 1px 2px rgba(255, 255, 255, 0.1),
    inset 0 -1px 2px rgba(0, 0, 0, 0.5),
    0 1px 2px rgba(0, 0, 0, 0.4);
}

.month-tracker-item--completed {
  color: #8bc34a;
  background: linear-gradient(135deg, rgba(139, 195, 74, 0.4) 0%, rgba(124, 179, 66, 0.3) 100%);
  border: 2px solid rgba(139, 195, 74, 0.7);
  box-shadow:
    inset 0 1px 3px rgba(139, 195, 74, 0.5),
    inset 0 -1px 2px rgba(0, 0, 0, 0.3),
    0 0 8px rgba(139, 195, 74, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.4);
  text-shadow:
    2px 2px 0 rgba(0, 0, 0, 0.95),
    0 0 10px rgba(139, 195, 74, 0.8);
}

.month-tracker-month {
  font-size: 0.6rem;
  line-height: 1;
  letter-spacing: 0.03em;
  position: relative;
}

.month-tracker-item--completed .month-tracker-month {
  text-decoration: line-through;
  text-decoration-color: #8bc34a;
  text-decoration-thickness: 2px;
  opacity: 0.8;
}

.month-tracker-cross {
  position: absolute;
  font-size: 0.85rem;
  font-weight: 900;
  color: #8bc34a;
  text-shadow:
    2px 2px 0 rgba(0, 0, 0, 0.95),
    0 0 8px rgba(139, 195, 74, 0.9);
  line-height: 1;
  font-family: 'Courier New', monospace;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
}

.bird-selector-btn {
  color: #e8dcc4 !important;
  min-width: 40px;
  min-height: 40px;
  font-size: 1.25rem;
  touch-action: manipulation;
  &:disabled {
    opacity: 0.5;
  }
}

.bird-preview {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.bird-preview-body {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid #f57c00;
  background: linear-gradient(135deg, #ffeb3b 0%, #ffc107 40%, #ff9800 100%);
  box-shadow:
    inset 2px 2px 0 rgba(255, 255, 255, 0.4),
    -1px -1px 0 rgba(0, 0, 0, 0.15);
}

.bird-preview-body::before {
  content: '';
  position: absolute;
  right: -11px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 12px solid #ff9800;
  border-right: none;
}

.bird-preview-wing {
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 235, 59, 0.9);
  border: 1px solid #f57c00;
}

.bird-preview-eye {
  position: absolute;
  right: 4px;
  top: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #000;
  z-index: 2;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.bird-preview-eye::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #fff;
}

// Game over
.game-over-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.game-over-box {
  background: linear-gradient(135deg, #2d1b4e 0%, #1a0a2e 100%);
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  border: 4px solid rgba(139, 195, 74, 0.6);
  min-width: 260px;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    0 4px 8px rgba(0, 0, 0, 0.6),
    0 0 20px rgba(139, 195, 74, 0.3);
}

.game-over-title {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  color: #8bc34a;
  font-weight: 900;
  font-family: 'Courier New', monospace;
  text-shadow:
    3px 3px 0 rgba(0, 0, 0, 0.8),
    0 0 8px rgba(139, 195, 74, 0.5);
  letter-spacing: 0.05em;
}

.game-over-score {
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
  color: white;
  font-weight: 800;
  font-family: 'Courier New', monospace;
  text-shadow:
    2px 2px 0 rgba(0, 0, 0, 0.8),
    0 0 4px rgba(0, 0, 0, 0.9);
}

.restart-btn {
  background: linear-gradient(90deg, #7cb342 0%, #8bc34a 100%);
  color: white;
  font-weight: 800;
  font-family: 'Courier New', monospace;
  min-height: 44px;
  padding: 0.5rem 1.5rem;
  touch-action: manipulation;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  box-shadow:
    inset 0 2px 4px rgba(255, 255, 255, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.4);
  text-shadow:
    1px 1px 0 rgba(0, 0, 0, 0.5),
    0 0 4px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.05em;
}

// Celebration overlay (one month down)
.celebration-overlay {
  position: fixed;
  inset: 0;
  z-index: 25;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  pointer-events: none;
}

.celebration-box {
  text-align: center;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, rgba(45, 27, 78, 0.95) 0%, rgba(26, 10, 46, 0.95) 100%);
  border-radius: 8px;
  border: 4px solid rgba(139, 195, 74, 0.7);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    0 4px 8px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(139, 195, 74, 0.4),
    0 0 80px rgba(147, 51, 234, 0.3);
  max-width: 90%;
  pointer-events: none;
}

.celebration-text {
  font-size: clamp(1.5rem, 5vw, 2.25rem);
  font-weight: 900;
  font-family: 'Courier New', monospace;
  color: #8bc34a;
  margin: 0;
  line-height: 1.3;
  text-shadow:
    3px 3px 0 rgba(0, 0, 0, 0.8),
    0 0 20px rgba(139, 195, 74, 0.6);
  letter-spacing: 0.05em;
}

.celebration-fade-enter-active,
.celebration-fade-leave-active {
  transition: opacity 0.35s ease;
}

.celebration-fade-enter-from,
.celebration-fade-leave-to {
  opacity: 0;
}

// Start prompt
.start-prompt {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 15;
  color: white;
  font-size: 1.25rem;
  font-weight: 800;
  font-family: 'Courier New', monospace;
  text-shadow:
    3px 3px 0 rgba(0, 0, 0, 0.8),
    0 0 8px rgba(0, 0, 0, 0.9);
  pointer-events: none;
  letter-spacing: 0.05em;
}

.start-fade-enter-active,
.start-fade-leave-active {
  transition: opacity 0.3s ease;
}

.start-fade-enter-from,
.start-fade-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .score-display-top {
    top: 5rem;
  }

  .score-display-top-value {
    font-size: 1.5rem;
  }

  .restart-btn {
    min-height: 48px;
    padding: 0.75rem 2rem;
    font-size: 1.1rem;
  }

  .game-over-box {
    padding: 1.5rem;
    min-width: 220px;
  }

  .game-over-title {
    font-size: 1.75rem;
  }

  .score-display-bottom {
    padding: 0 0.5rem;
    gap: 0.3rem;
    bottom: calc(6.5rem - 1.5%);
  }

  .month-tracker {
    gap: 0.25rem;
    margin-left: 0.15rem;
    margin-right: 0;
    max-width: 140px;
  }

  .month-tracker-label {
    font-size: 0.6rem;
  }

  .month-tracker-grid {
    max-width: 135px;
    min-width: 115px;
    padding: 0.35rem 0.3rem;
    gap: 0.15rem;
  }

  .month-tracker-item {
    padding: 0.2rem 0.15rem;
    min-height: 1.2rem;
    font-size: 0.55rem;
  }

  .month-tracker-month {
    font-size: 0.5rem;
  }

  .month-tracker-cross {
    font-size: 0.7rem;
  }
}
</style>
