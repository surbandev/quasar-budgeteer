<template>
  <q-card class="spent-chart-card buddy-overlap-card">
    <q-card-section>
      <!-- Buddy-style hero: spent + remaining side by side -->
      <div class="buddy-chart-hero buddy-chart-hero-split">
        <div class="hero-stat">
          <span class="chart-label">{{ chartLabel }}</span>
          <h2 class="chart-amount">{{ formatCurrency(totalSpent) }}</h2>
        </div>
        <div class="hero-stat hero-stat-right">
          <span class="chart-label">{{ leftLabel }}</span>
          <h2 class="chart-amount left-amount">{{ formatCurrency(leftThisMonth) }}</h2>
        </div>
      </div>

      <div class="chart-wrapper">
        <Line :data="chartData" :options="chartOptions" />
        <transition name="chart-fade">
          <div v-if="loading" class="chart-loading-overlay">
            <q-spinner-dots color="primary" size="48px" />
            <span class="chart-loading-text">Loading range…</span>
          </div>
        </transition>
      </div>

      <div class="chart-legend">
        <div class="legend-item">
          <div class="legend-dot purple"></div>
          <span class="legend-text">This period</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot green"></div>
          <span class="legend-text">Income</span>
        </div>
      </div>

      <!-- Planning-only "Connected Accounts" → active scenario layers -->
      <div class="scenarios-panel">
        <div class="scenarios-panel-header">
          <h3 class="scenarios-panel-title">Active Scenarios</h3>
          <div class="scenarios-panel-actions">
            <q-btn flat dense round icon="more_horiz" color="white" size="sm">
              <q-menu anchor="bottom right" self="top right" class="scenario-menu" :offset="[0, 8]">
                <div class="scenario-menu-content">
                  <div class="scenario-menu-header">
                    <q-icon name="layers" size="20px" />
                    <span class="scenario-menu-title">Scenario layers</span>
                  </div>
                  <div class="scenario-menu-subtitle">
                    Combine scenarios to include their planned events
                  </div>
                  <q-separator class="q-my-sm" />
                  <div class="scenarios-list">
                    <div class="scenario-card default-scenario active">
                      <div class="scenario-card-content">
                        <div class="scenario-info">
                          <q-icon name="check_circle" color="positive" size="20px" />
                          <span class="scenario-name">Base Budget</span>
                        </div>
                        <div class="scenario-status">
                          <span class="status-badge default-badge">Default</span>
                        </div>
                      </div>
                    </div>
                    <div
                      v-for="scenario in availableScenarios"
                      :key="scenario.id"
                      class="scenario-card"
                      :class="{ active: activeScenarios.has(scenario.id) }"
                    >
                      <div class="scenario-card-content" @click="$emit('toggleScenario', scenario)">
                        <div class="scenario-info">
                          <q-icon
                            :name="
                              activeScenarios.has(scenario.id)
                                ? 'check_circle'
                                : 'radio_button_unchecked'
                            "
                            :color="activeScenarios.has(scenario.id) ? 'positive' : 'grey-6'"
                            size="20px"
                          />
                          <span class="scenario-name">{{ scenario.name }}</span>
                        </div>
                        <div class="scenario-status">
                          <span
                            v-if="activeScenarios.has(scenario.id)"
                            class="status-badge active-badge"
                          >
                            Active
                          </span>
                          <span v-else class="status-badge inactive-badge">Inactive</span>
                        </div>
                      </div>
                      <q-btn
                        flat
                        dense
                        round
                        icon="delete_outline"
                        size="sm"
                        color="negative"
                        @click.stop="$emit('deleteScenario', scenario)"
                        class="scenario-delete-btn"
                      >
                        <q-tooltip>Delete scenario</q-tooltip>
                      </q-btn>
                    </div>
                    <div v-if="availableScenarios.length === 0" class="no-scenarios-message">
                      <span>No additional scenarios</span>
                    </div>
                  </div>
                  <q-separator class="q-my-sm" />
                  <q-btn
                    flat
                    no-caps
                    dense
                    icon="compare_arrows"
                    label="Compare scenarios"
                    class="full-width scenario-compare-link"
                    @click="goToCompare"
                  />
                </div>
              </q-menu>
            </q-btn>
            <q-btn
              flat
              dense
              round
              icon="settings"
              color="white"
              size="sm"
              @click="goToScenarios"
            />
          </div>
        </div>

        <div class="scenarios-panel-list">
          <div class="scenario-row">
            <span class="scenario-row-name">Income</span>
            <span class="scenario-row-amount positive">{{ formatCurrency(monthlyIncome) }}</span>
          </div>
          <div class="scenario-row">
            <span class="scenario-row-name">Bills</span>
            <span class="scenario-row-amount">{{ formatCurrency(monthlyExpenses) }}</span>
          </div>
          <div class="scenario-row scenario-row-net">
            <span class="scenario-row-name">Net</span>
            <span class="scenario-row-amount" :class="netClass(planNet)">
              {{ formatSignedCurrency(planNet) }}
            </span>
          </div>
        </div>

        <p class="scenarios-panel-footer">
          {{ activeLayerCount }} layer{{ activeLayerCount === 1 ? '' : 's' }} in this view
        </p>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useEventsStore } from '../stores/events'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const props = defineProps({
  spentData: {
    type: Array,
    default: () => [],
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  monthlyBalance: {
    type: Number,
    default: 0,
  },
  monthlySavings: {
    type: Number,
    default: 0,
  },
  monthlyIncome: {
    type: Number,
    default: 0,
  },
  monthlyExpenses: {
    type: Number,
    default: 0,
  },
  totalExpensesLeft: {
    type: Number,
    default: 0,
  },
  dailyIncome: {
    type: Array,
    default: () => [],
  },
  dailyExpenses: {
    type: Array,
    default: () => [],
  },
  availableScenarios: {
    type: Array,
    default: () => [],
  },
  activeScenarios: {
    type: Set,
    default: () => new Set(['default']),
  },
  profiles: {
    type: Array,
    default: () => [],
  },
  currentProfile: {
    type: Object,
    default: null,
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  isOneYearView: {
    type: Boolean,
    default: false,
  },
  quickRangePreset: {
    type: String,
    default: 'month',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['toggleScenario', 'deleteScenario'])

const eventsStore = useEventsStore()

// Use store values as single source of truth (override props if store has values)
const monthlyIncome = computed(() => eventsStore.monthlyIncome || props.monthlyIncome)
const monthlyExpenses = computed(() => eventsStore.monthlyExpenses || props.monthlyExpenses)
const leftThisMonth = computed(() => props.totalExpensesLeft || 0)
const planNet = computed(() => monthlyIncome.value - monthlyExpenses.value)

// Scenarios currently layered on top of the base plan (menu only).
const activeLayerScenarios = computed(() =>
  props.availableScenarios.filter((s) => props.activeScenarios.has(s.id)),
)
const activeLayerCount = computed(() => 1 + activeLayerScenarios.value.length)

const router = useRouter()

function goToScenarios() {
  router.push({ name: 'CreateScenario' })
}

function goToCompare() {
  router.push('/compare')
}

// Calculate if date range is more than a month
const isMoreThanMonth = computed(() => {
  if (!props.startDate || !props.endDate) return false
  const start = new Date(props.startDate)
  const end = new Date(props.endDate)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const timeDiff = end.getTime() - start.getTime()
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end days
  return daysDiff > 31
})

// Chart label based on date range
const chartLabel = computed(() => {
  return isMoreThanMonth.value ? 'SPENT IN THIS TERM' : 'SPENT THIS MONTH'
})

const leftLabel = computed(() => {
  return isMoreThanMonth.value ? 'LEFT THIS TERM' : 'LEFT THIS MONTH'
})

function netClass(value) {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return ''
}

function formatSignedCurrency(amount) {
  const value = Number(amount) || 0
  const formatted = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  if (value < 0) return `-$${formatted}`
  return `$${formatted}`
}

const cumulativeSpending = computed(() => {
  const daily = props.dailyExpenses.length > 0 ? props.dailyExpenses : props.spentData
  if (!daily.length) return []

  let sum = 0
  const cumulative = daily.map((amount) => {
    sum += amount || 0
    return sum
  })

  const target = monthlyExpenses.value
  const finalValue = cumulative[cumulative.length - 1] || 0
  if (target > 0 && finalValue > 0 && Math.abs(finalValue - target) > 0.01) {
    const ratio = target / finalValue
    return cumulative.map((val) => Math.round(val * ratio * 100) / 100)
  }
  return cumulative
})

const cumulativeIncome = computed(() => {
  const daily = props.dailyIncome
  if (!daily.length) return []

  let sum = 0
  const cumulative = daily.map((amount) => {
    sum += amount || 0
    return sum
  })

  const target = monthlyIncome.value
  const finalValue = cumulative[cumulative.length - 1] || 0
  if (target > 0 && finalValue > 0 && Math.abs(finalValue - target) > 0.01) {
    const ratio = target / finalValue
    return cumulative.map((val) => Math.round(val * ratio * 100) / 100)
  }
  return cumulative
})

function buildIncomeLineFallback(pointCount) {
  if (pointCount <= 0) return []
  const total = monthlyIncome.value || 0
  if (pointCount === 1) return [total]
  return Array.from({ length: pointCount }, (_, i) =>
    Math.round((total / (pointCount - 1)) * i * 100) / 100,
  )
}

const dailyBillAmounts = computed(() =>
  props.dailyExpenses.length > 0 ? props.dailyExpenses : props.spentData,
)

// Index of the last day in the range that has a planned bill/debit.
const lastBillDayIndex = computed(() => {
  const daily = dailyBillAmounts.value
  for (let i = daily.length - 1; i >= 0; i--) {
    if ((daily[i] || 0) > 0) return i
  }
  return -1
})

function shouldShowXTick(index, labels) {
  if (index < 0 || index >= labels.length) return false
  if (index === lastBillDayIndex.value) return true

  if (props.isOneYearView && labels.length > 0) {
    const label = String(labels[index] || '')
    const dayToken = label.split(' ')[1]
    const day = Number(dayToken)
    if (day === 1 || index === labels.length - 1) return true
    return false
  }

  if (labels.length <= 7) return true

  const step = Math.ceil(labels.length / 7)
  return index % step === 0 || index === labels.length - 1
}

// Progressive reveal is disabled: the chart now renders the full series instantly
// for every range (including 6m / 1y) so the home page never feels like it is
// slowly "drawing in".
const shouldUseProgressiveAnimation = computed(() => false)

const animatedPointCount = ref(0)
const progressiveFrameId = ref(null)
const lastRevealSignature = ref('')
let revealDebounceTimer = null

function clearProgressiveTimer() {
  if (progressiveFrameId.value !== null) {
    cancelAnimationFrame(progressiveFrameId.value)
    progressiveFrameId.value = null
  }
}

function getExpectedDayCountFromRange() {
  if (!props.startDate || !props.endDate) return null
  const start = new Date(props.startDate.getTime())
  const end = new Date(props.endDate.getTime())
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const ms = end.getTime() - start.getTime()
  if (ms < 0) return null
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1
}

function startProgressiveReveal() {
  clearProgressiveTimer()

  const totalPoints = dateLabels.value.length || 0
  const expectedDays = getExpectedDayCountFromRange()
  if (
    shouldUseProgressiveAnimation.value &&
    expectedDays != null &&
    totalPoints > 0 &&
    totalPoints < expectedDays
  ) {
    return
  }

  const signature = `${props.quickRangePreset}:${totalPoints}:${dateLabels.value[0] || ''}:${dateLabels.value[totalPoints - 1] || ''}`
  if (lastRevealSignature.value === signature) return
  lastRevealSignature.value = signature

  if (totalPoints <= 0) {
    animatedPointCount.value = 0
    return
  }

  if (!shouldUseProgressiveAnimation.value) {
    animatedPointCount.value = totalPoints
    return
  }

  animatedPointCount.value = 1

  // requestAnimationFrame + time-based progress: updates every frame, no multi-point jumps.
  // Kept short so the left-to-right draw reads as a quick flourish, not a multi-second
  // wait (previously up to 9s for the 1-year view).
  const totalDurationMs = Math.min(900, Math.max(450, totalPoints * 4))
  const startTime = performance.now()

  function revealFrame(now) {
    const elapsed = now - startTime
    const t = Math.min(1, elapsed / totalDurationMs)
    // Linear in time → steady left-to-right draw; rAF updates every frame (no interval batching)
    const nextCount = Math.max(1, Math.min(totalPoints, Math.ceil(t * totalPoints)))
    animatedPointCount.value = nextCount

    if (nextCount < totalPoints) {
      progressiveFrameId.value = requestAnimationFrame(revealFrame)
    } else {
      progressiveFrameId.value = null
    }
  }

  progressiveFrameId.value = requestAnimationFrame(revealFrame)
}

function scheduleProgressiveReveal() {
  if (revealDebounceTimer) {
    clearTimeout(revealDebounceTimer)
    revealDebounceTimer = null
  }
  revealDebounceTimer = setTimeout(() => {
    revealDebounceTimer = null
    nextTick(() => {
      startProgressiveReveal()
    })
  }, 120)
}

onBeforeUnmount(() => {
  clearProgressiveTimer()
  if (revealDebounceTimer) {
    clearTimeout(revealDebounceTimer)
    revealDebounceTimer = null
  }
})

// Generate date labels for x-axis
const dateLabels = computed(() => {
  // Ensure labels match the data array length
  const dataLength = props.spentData.length

  if (!props.startDate || !props.endDate || dataLength === 0) {
    // Fallback to day numbers if no dates provided
    const days = []
    const numDays = dataLength || 31
    for (let i = 1; i <= numDays; i++) {
      days.push(i)
    }
    return days
  }

  // Create dates from the props, ensuring we use the exact date values
  const start = new Date(props.startDate.getTime())
  const end = new Date(props.endDate.getTime())
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const labels = []
  const currentDate = new Date(start.getTime())

  // Generate labels for each day in the range
  let dayCount = 0
  while (currentDate <= end && dayCount < dataLength) {
    // Format: show day number for single month, or date for multi-month
    if (isMoreThanMonth.value) {
      // For multi-month, show abbreviated date (e.g., "Jan 1", "Feb 15")
      const month = currentDate.toLocaleDateString('en-US', { month: 'short' })
      const day = currentDate.getDate()
      labels.push(`${month} ${day}`)
    } else {
      // For single month, just show day number
      labels.push(currentDate.getDate())
    }
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
    dayCount++
  }

  // Ensure we have the same number of labels as data points
  while (labels.length < dataLength) {
    if (isMoreThanMonth.value) {
      const month = currentDate.toLocaleDateString('en-US', { month: 'short' })
      const day = currentDate.getDate()
      labels.push(`${month} ${day}`)
    } else {
      labels.push(currentDate.getDate())
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return labels.slice(0, dataLength)
})

watch(
  [dateLabels, () => cumulativeSpending.value.length],
  () => {
    scheduleProgressiveReveal()
  },
  { immediate: true },
)

// Generate mock data if none provided
function generateMockData() {
  // Mock data that creates the curve shown in the screenshot
  const baseAmounts = [
    120, 85, 95, 110, 105, 140, 130, 155, 145, 160, 170, 185, 180, 200, 210, 230, 245, 260, 280,
    295, 320, 340, 365, 390, 420, 460, 510, 580, 650, 720, 800,
  ]
  return baseAmounts
}

const chartData = computed(() => {
  const spending =
    cumulativeSpending.value.length > 0
      ? cumulativeSpending.value
      : (() => {
          const data = props.spentData.length > 0 ? props.spentData : generateMockData()
          let sum = 0
          return data.map((amount) => {
            sum += amount
            return sum
          })
        })()

  const income =
    cumulativeIncome.value.length === spending.length
      ? cumulativeIncome.value
      : buildIncomeLineFallback(spending.length)

  const datasets = [
    {
      label: 'Income',
      data: income,
      borderColor: 'transparent',
      borderWidth: 0,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx
        const chart = context.chart
        const gradient = ctx.createLinearGradient(
          0,
          chart.chartArea?.top ?? 0,
          0,
          chart.chartArea?.bottom ?? 300,
        )
        gradient.addColorStop(0, 'rgba(74, 222, 128, 0.2)')
        gradient.addColorStop(0.55, 'rgba(74, 222, 128, 0.09)')
        gradient.addColorStop(1, 'rgba(74, 222, 128, 0)')
        return gradient
      },
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0.42,
      cubicInterpolationMode: 'monotone',
      fill: true,
      order: 0,
    },
    {
      label: 'This period',
      data: spending,
      borderColor: '#a855f7',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx
        const chart = context.chart
        const gradient = ctx.createLinearGradient(
          0,
          chart.chartArea?.top ?? 0,
          0,
          chart.chartArea?.bottom ?? 300,
        )
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.28)')
        gradient.addColorStop(0.55, 'rgba(147, 51, 234, 0.1)')
        gradient.addColorStop(1, 'rgba(126, 34, 206, 0)')
        return gradient
      },
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#a855f7',
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 2,
      tension: 0.42,
      cubicInterpolationMode: 'monotone',
      fill: true,
      order: 2,
    },
  ]

  const totalLabelCount = dateLabels.value.length
  const visiblePointCount = shouldUseProgressiveAnimation.value
    ? Math.max(1, Math.min(animatedPointCount.value || 1, totalLabelCount))
    : totalLabelCount

  return {
    labels: dateLabels.value.slice(0, visiblePointCount),
    datasets: datasets.map((dataset) => ({
      ...dataset,
      data: Array.isArray(dataset.data) ? dataset.data.slice(0, visiblePointCount) : dataset.data,
    })),
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  // Data is preloaded/cached before the chart mounts, so a single short entrance
  // animation reads as a polished flourish rather than a sluggish "draw-in".
  animation: {
    duration: 700,
    easing: 'easeOutQuart',
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(30, 30, 30, 0.95)',
      titleColor: 'rgba(255, 255, 255, 0.9)',
      bodyColor: 'rgba(255, 255, 255, 0.8)',
      borderColor: 'rgba(168, 85, 247, 0.5)',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(context.parsed.y)
          }
          return label
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
        font: {
          size: 11,
        },
        maxRotation: isMoreThanMonth.value ? 45 : 0,
        autoSkip: true,
        maxTicksLimit: 7,
        callback: function (value, index) {
          const labels = dateLabels.value
          return shouldShowXTick(index, labels) ? labels[index] || '' : ''
        },
      },
    },
    y: {
      display: false,
      beginAtZero: true,
      min: 0,
      grace: '5%',
    },
  },
}))

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
</script>

<style scoped lang="scss">
.spent-chart-card {
  :deep(.q-card__section) {
    padding: 1.35rem 1.25rem 1.15rem;
  }
}

.buddy-chart-hero {
  margin-bottom: 0.5rem;
}

.buddy-chart-hero-split {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.hero-stat {
  flex: 1;
  min-width: 0;

  &.hero-stat-right {
    text-align: right;
  }
}

.scenario-row-net {
  margin-top: 0.15rem;
  padding-top: 0.65rem;
  border-top: 1px solid var(--buddy-hairline);
}

.scenario-row-amount {
  color: var(--buddy-text);
  font-size: 0.95rem;
  font-weight: 600;

  &.positive {
    color: #4ade80;
  }

  &.negative {
    color: #f87171;
  }
}

.chart-amount {
  color: white;
  font-size: 2.75rem;
  font-weight: 700;
  margin: 0.15rem 0 0;
  line-height: 1;
  letter-spacing: -1.5px;

  &.left-amount {
    color: #f87171;
  }
}

@media (max-width: 380px) {
  .chart-amount {
    font-size: 2.15rem;
  }
}

.scenarios-panel {
  margin-top: 1.25rem;
  padding-top: 1.15rem;
  border-top: 1px solid var(--buddy-hairline);
}

.scenarios-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.85rem;
}

.scenarios-panel-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--buddy-text);
}

.scenarios-panel-actions {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

.scenarios-panel-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.scenario-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.scenario-row-name {
  color: var(--buddy-text);
  font-size: 0.95rem;
  font-weight: 500;
}

.scenario-row-tag {
  color: var(--buddy-text-dim);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.scenarios-panel-footer {
  margin: 0.85rem 0 0;
  color: var(--buddy-text-faint);
  font-size: 0.78rem;
}

.chart-label {
  display: block;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.chart-wrapper {
  height: 200px;
  margin: 0.65rem -0.15rem 0.5rem;
  position: relative;
}

.chart-legend {
  display: flex;
  gap: 1.25rem;
  justify-content: center;
  padding: 0.35rem 0 0;
}

.chart-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  background: rgba(13, 13, 13, 0.55);
  backdrop-filter: blur(2px);
  border-radius: 12px;
  z-index: 2;
}

.chart-loading-text {
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.85rem;
  letter-spacing: 0.3px;
}

.chart-fade-enter-active,
.chart-fade-leave-active {
  transition: opacity 0.2s ease;
}

.chart-fade-enter-from,
.chart-fade-leave-to {
  opacity: 0;
}

.chart-legend {
  display: flex;
  gap: 1.25rem;
  justify-content: center;
  padding: 0.35rem 0 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.purple {
    background: #a855f7;
  }

  &.green {
    background: rgba(74, 222, 128, 0.35);
    box-shadow: inset 0 0 0 1px rgba(74, 222, 128, 0.45);
  }
}

.legend-text {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.75rem;
  font-weight: 400;
}

// Snapshot Section (legacy styles kept for menu)
.snapshot-section {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: none;
}

.snapshot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.snapshot-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: white;
  margin: 0;
  letter-spacing: -0.3px;
}

.snapshot-actions {
  display: flex;
  gap: 0.25rem;
}

.snapshot-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.snapshot-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0;
}

.snapshot-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  font-weight: 400;
  white-space: nowrap;
}

.snapshot-dots {
  flex: 1;
  height: 1px;
  background-image: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 50%
  );
  background-size: 6px 1px;
  background-repeat: repeat-x;
  margin: 0 0.5rem;
}

.snapshot-value {
  color: white;
  font-size: 1.05rem;
  font-weight: 600;
  white-space: nowrap;

  &.positive {
    color: #4caf50;
  }

  &.negative {
    color: #f44336;
  }
}

.snapshot-footer {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.snapshot-right-controls {
  flex: 1;
  min-width: 320px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.profile-select {
  max-width: 200px;
  width: 100%;

  :deep(.q-field__control) {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(168, 85, 247, 0.3);
    border-radius: 8px;
    color: white;
  }

  :deep(.q-field__label) {
    color: rgba(255, 255, 255, 0.7);
  }

  :deep(.q-field__native) {
    color: white;
  }

  :deep(.q-field__messages) {
    color: rgba(255, 255, 255, 0.7) !important;
  }

  :deep(.q-field__hint) {
    color: rgba(255, 255, 255, 0.6) !important;
  }

  &.q-field--focused {
    :deep(.q-field__control) {
      border-color: #a855f7;
      box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2);
    }

    :deep(.q-field__label) {
      color: #a855f7;
    }
  }
}

// Scenario menu styles
.scenario-menu-content {
  background: rgba(30, 30, 35, 0.98);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1rem;
  min-width: 280px;
  color: white;
}

.scenario-menu-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  margin-bottom: 0.5rem;

  .q-icon {
    color: rgba(168, 85, 247, 0.8);
  }
}

.scenario-menu-title {
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

.scenario-menu-subtitle {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.scenarios-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.scenario-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.875rem;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);

    .scenario-delete-btn {
      opacity: 1;
      transform: scale(1);
    }
  }

  &.active {
    background: rgba(76, 175, 80, 0.15);
    border-color: rgba(76, 175, 80, 0.4);

    &:hover {
      background: rgba(76, 175, 80, 0.2);
      border-color: rgba(76, 175, 80, 0.5);
    }
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.scenario-card-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.scenario-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.scenario-name {
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
}

.scenario-status {
  display: flex;
  align-items: center;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.active-badge {
  background: rgba(76, 175, 80, 0.2);
  color: #81c784;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.inactive-badge {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.default-badge {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(56, 142, 60, 0.3));
  color: #a5d6a7;
  border: 1px solid rgba(76, 175, 80, 0.5);
}

.default-scenario {
  cursor: default;
  background: rgba(76, 175, 80, 0.15);
  border-color: rgba(76, 175, 80, 0.4);

  &:hover {
    transform: none;
    background: rgba(76, 175, 80, 0.15);
    border-color: rgba(76, 175, 80, 0.4);
  }
}

.no-scenarios-message {
  padding: 1.5rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  font-style: italic;
}

.scenario-delete-btn {
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(244, 67, 54, 0.2);
  }

  :deep(.q-icon) {
    font-size: 20px;
  }
}

// Mobile optimization
@media (max-width: 600px) {
  .spent-chart-card {
    border-radius: 20px;

    :deep(.q-card__section) {
      padding: 1.25rem 1.25rem 1rem;
    }
  }

  .chart-label {
    font-size: 0.65rem;
  }

  .chart-header {
    flex-direction: column;
    gap: 1rem;
  }

  .chart-header-center {
    align-items: flex-start;
  }

  .chart-header-right {
    align-items: flex-start;
    text-align: left;
  }

  .chart-amount {
    font-size: 2.25rem;
  }

  .chart-wrapper {
    height: 160px;
    margin: 0.75rem 0 0.5rem;
  }

  .chart-legend {
    gap: 1.25rem;
    padding: 0.4rem 0;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
  }

  .legend-text {
    font-size: 0.75rem;
  }

  .snapshot-section {
    margin-top: 1.25rem;
    padding-top: 1rem;
  }

  .snapshot-title {
    font-size: 1.25rem;
  }

  .snapshot-list {
    gap: 0.4rem;
  }

  .snapshot-item {
    padding: 0.3rem 0;
  }

  .snapshot-label {
    font-size: 0.85rem;
  }

  .snapshot-value {
    font-size: 0.95rem;
  }

  .snapshot-footer {
    margin-top: 0.85rem;
    padding-top: 0.65rem;
    flex-direction: column;
    align-items: stretch;
  }

  .snapshot-right-controls {
    min-width: 0;
    width: 100%;
  }

  .snapshot-sync {
    font-size: 0.75rem;
  }
}

@media (min-width: 1024px) {
  .spent-chart-card {
    :deep(.q-card__section) {
      padding: 2rem 2.5rem 1.75rem;
    }
  }

  .chart-header {
    gap: 2rem;
  }

  .chart-amount {
    font-size: 3.25rem;
  }

  .chart-wrapper {
    height: 220px;
  }

  .snapshot-title {
    font-size: 1.6rem;
  }

  .snapshot-label {
    font-size: 1rem;
  }

  .snapshot-value {
    font-size: 1.1rem;
  }

  // Make profile selector wider on desktop
  .snapshot-footer {
    justify-content: flex-start;
    align-items: center;
  }

  .profile-select {
    max-width: 300px;
    width: 100%;
  }
}
</style>
