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

      <!-- Pipes -->
      <div v-for="(pipe, index) in pipes" :key="index" class="pipe-pair" :style="pipeStyle(pipe)">
        <div class="pipe pipe-top"></div>
        <div class="pipe pipe-bottom"></div>
      </div>

      <!-- Bird -->
      <div
        class="bird"
        :class="[{ flapping: isFlapping }, 'bird-skin-' + birdSkins[selectedBirdIndex].id]"
        :style="birdStyle"
      >
        <div class="bird-body"></div>
        <div class="bird-wing"></div>
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
    </div>

    <!-- Bird selector (far left) + Score (center) in brown dirt area at bottom -->
    <div class="score-display-bottom">
      <div class="bird-selector" @click.stop>
        <q-btn
          flat
          dense
          round
          icon="chevron_left"
          class="bird-selector-btn"
          :disable="gameStarted"
          @click="prevBird"
        />
        <div
          class="bird-preview"
          :class="'bird-skin-' + birdSkins[selectedBirdIndex].id"
          aria-label="Selected bird"
        >
          <div class="bird-preview-body"></div>
          <div class="bird-preview-wing"></div>
        </div>
        <q-btn
          flat
          dense
          round
          icon="chevron_right"
          class="bird-selector-btn"
          :disable="gameStarted"
          @click="nextBird"
        />
      </div>
      <div class="score-number-wrap">
        <span class="score-number-label">Best</span>
        <span class="score-number">{{ bestScore }}</span>
      </div>
      <div class="bird-selector-spacer" aria-hidden="true"></div>
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

    <!-- Start prompt -->
    <Transition name="start-fade">
      <div v-if="showStartPrompt" class="start-prompt">
        <p>Tap or click to flap</p>
      </div>
    </Transition>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

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
const score = ref(0)
const bestScore = ref(0)
const birdY = ref(40)
const birdVelocity = ref(0)
const pipes = ref([])
const showStartPrompt = ref(true)
const isFlapping = ref(false)
const viewportWidth = ref(400)
const viewportHeight = ref(600)
const scrollOffset = ref(0)
const gameStartTime = ref(0)

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
  // Keep entire gap above the ground with margin (gap center + half gap must be above ground)
  const minGapY = PIPE_GAP / 2 + 80
  const maxGapY = groundTopPx - PIPE_GAP / 2 - 40
  if (maxGapY <= minGapY) return
  const gapY = minGapY + Math.random() * (maxGapY - minGapY)
  pipes.value.push({
    x: viewportWidth.value + PIPE_WIDTH,
    gapY,
    scored: false,
  })
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
          if (score.value > bestScore.value) {
            bestScore.value = score.value
            saveBestScore()
          }
        }
        return next
      })
      .filter((p) => p.x > -PIPE_WIDTH - 20)

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
}

function scheduleNextPipe() {
  if (gameOver.value || !gameStarted.value) return
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

function restart() {
  gameOver.value = false
  score.value = 0
  birdY.value = 40
  birdVelocity.value = 0
  scrollOffset.value = 0
  gameStartTime.value = 0
  pipes.value = []
  showStartPrompt.value = true
  gameStarted.value = false
  if (pipeSpawnTimer) {
    clearTimeout(pipeSpawnTimer)
    pipeSpawnTimer = null
  }
  animationId = requestAnimationFrame(gameLoop)
}

// Mobile: ensure restart fires on touch (touchend) since click can be delayed or swallowed
function onRestartTouch() {
  restart()
}

onMounted(() => {
  loadSelectedBird()
  loadBestScore()
  measureViewport()
  resizeObserver = new ResizeObserver(measureViewport)
  const el = document.querySelector('.weave-page')
  if (el) resizeObserver.observe(el)
  animationId = requestAnimationFrame(gameLoop)
})

onUnmounted(() => {
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
}

.pipe {
  position: absolute;
  left: 0;
  width: 100%;
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
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border: 6px solid transparent;
  border-left-color: #ff9800;
  border-right: none;
}

.bird-wing {
  position: absolute;
  left: 2px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 8px;
  background: rgba(255, 235, 59, 0.9);
  border-radius: 50%;
  border: 1px solid #f57c00;
  transform-origin: right center;
  transition: transform 0.12s ease-out;
}

.bird.flapping .bird-wing {
  transform: translateY(-50%) rotate(-35deg) scaleX(1.2);
}

// Bird skin variants (game bird + preview)
.bird-skin-red .bird-body,
.bird-skin-red .bird-preview-body {
  background: linear-gradient(135deg, #ffcdd2 0%, #ef5350 40%, #c62828 100%);
  border-color: #b71c1c;
}
.bird-skin-red .bird-body::before,
.bird-skin-red .bird-preview-body::before {
  border-left-color: #e65100;
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
  border-left-color: #0d47a1;
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
  border-left-color: #558b2f;
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
  border-left-color: #7b1fa2;
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
  border-left-color: #00796b;
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
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.95;
}

.score-display-top-value {
  font-size: clamp(1.75rem, 6vw, 2.5rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}

// Score + bird selector in brown dirt area at bottom - above bottom nav (~64px)
.score-display-bottom {
  position: fixed;
  bottom: 6.5rem;
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
}

.score-number-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.9;
}

.score-display-bottom .score-number {
  font-size: clamp(2.25rem, 11vw, 4rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}

.bird-selector-spacer {
  width: 132px;
  flex-shrink: 0;
}

.bird-selector-btn {
  color: #e8dcc4 !important;
  min-width: 40px;
  min-height: 40px;
  font-size: 1.25rem;
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
  box-shadow: inset 2px 2px 0 rgba(255, 255, 255, 0.4);
}

.bird-preview-body::before {
  content: '';
  position: absolute;
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border: 5px solid transparent;
  border-left-color: #ff9800;
  border-right: none;
}

.bird-preview-wing {
  position: absolute;
  left: 3px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 235, 59, 0.9);
  border: 1px solid #f57c00;
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
  border-radius: 16px;
  text-align: center;
  border: 2px solid rgba(139, 195, 74, 0.4);
  min-width: 260px;
}

.game-over-title {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  color: #8bc34a;
}

.game-over-score {
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
  color: white;
}

.restart-btn {
  background: linear-gradient(90deg, #7cb342 0%, #8bc34a 100%);
  color: white;
  font-weight: 600;
  min-height: 44px;
  padding: 0.5rem 1.5rem;
  touch-action: manipulation;
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
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  pointer-events: none;
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
}
</style>
