<template>
  <q-card class="spent-chart-card glass-card">
    <q-card-section>
      <div class="chart-header">
        <div class="chart-header-left">
          <span class="chart-label">{{ chartLabel }}</span>
          <h2 class="chart-amount">{{ formatCurrency(totalSpent) }}</h2>
        </div>
        <div class="chart-header-right">
          <span class="chart-label">TOTAL EXPENSES LEFT THIS MONTH</span>
          <h2 class="chart-amount negative">{{ formatCurrency(totalExpensesLeft || 0) }}</h2>
        </div>
      </div>

      <div class="chart-wrapper">
        <Line :data="chartData" :options="chartOptions" />
      </div>

      <div class="chart-legend">
        <div class="legend-item" v-if="dailyIncome.length > 0">
          <div class="legend-dot purple"></div>
          <span class="legend-text">Income</span>
        </div>
        <div class="legend-item" v-if="dailyExpenses.length > 0">
          <div class="legend-dot red"></div>
          <span class="legend-text">Expenses</span>
        </div>
      </div>

      <!-- Scenario Section -->
      <div class="snapshot-section">
        <div class="snapshot-header">
          <h3 class="snapshot-title">Scenario's</h3>
          <div class="snapshot-actions">
            <q-btn flat dense round icon="more_horiz" color="white" size="sm">
              <q-menu anchor="bottom right" self="top right" class="scenario-menu" :offset="[0, 8]">
                <div class="scenario-menu-content">
                  <div class="scenario-menu-header">
                    <q-icon name="layers" size="20px" />
                    <span class="scenario-menu-title">Scenario Toggles</span>
                  </div>
                  <div class="scenario-menu-subtitle">
                    Combine scenarios to include their events
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

        <div class="snapshot-list">
          <div class="snapshot-item">
            <span class="snapshot-label">Cash Flow</span>
            <span class="snapshot-dots"></span>
            <span class="snapshot-value" :class="monthlyBalance >= 0 ? 'positive' : 'negative'">
              {{ formatCurrency(monthlyBalance) }}
            </span>
          </div>

          <div class="snapshot-item">
            <span class="snapshot-label">Savings</span>
            <span class="snapshot-dots"></span>
            <span class="snapshot-value positive">
              {{ formatCurrency(monthlySavings) }}
            </span>
          </div>

          <div class="snapshot-item">
            <span class="snapshot-label">Income</span>
            <span class="snapshot-dots"></span>
            <span class="snapshot-value positive">
              {{ formatCurrency(monthlyIncome) }}
            </span>
          </div>

          <div class="snapshot-item">
            <span class="snapshot-label">Expenses</span>
            <span class="snapshot-dots"></span>
            <span class="snapshot-value negative">
              {{ formatCurrency(monthlyExpenses) }}
            </span>
          </div>
        </div>

        <div class="snapshot-footer">
          <q-select
            v-model="selectedProfileId"
            :options="profileOptions"
            label="Profile"
            outlined
            dense
            dark
            emit-value
            map-options
            class="profile-select"
            @update:model-value="onProfileChange"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
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
})

const emit = defineEmits(['toggleScenario', 'deleteScenario', 'profileChange'])

const eventsStore = useEventsStore()

// Use store values as single source of truth (override props if store has values)
const monthlyIncome = computed(() => eventsStore.monthlyIncome || props.monthlyIncome)
const monthlyExpenses = computed(() => eventsStore.monthlyExpenses || props.monthlyExpenses)
const monthlySavings = computed(() => eventsStore.monthlySavings || props.monthlySavings)
const monthlyBalance = computed(() => eventsStore.cashFlow || props.monthlyBalance)

const selectedProfileId = ref(props.currentProfile?.id || props.currentProfile?._id || null)

const profileOptions = computed(() => {
  return props.profiles.map((profile) => {
    const profileName =
      profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile.first_name || profile.last_name || profile.name || 'Unnamed Profile'
    return {
      label: profileName,
      value: profile.id || profile._id,
    }
  })
})

function onProfileChange(profileId) {
  const selectedProfile = props.profiles.find((p) => p.id === profileId || p._id === profileId)
  if (selectedProfile) {
    emit('profileChange', selectedProfile)
  }
}

// Watch for changes in currentProfile prop
watch(
  () => props.currentProfile,
  (newProfile) => {
    if (newProfile) {
      const newProfileId = newProfile.id || newProfile._id
      if (newProfileId !== selectedProfileId.value) {
        selectedProfileId.value = newProfileId
      }
    }
  },
  { immediate: true },
)

const router = useRouter()

function goToScenarios() {
  router.push({ name: 'CreateScenario' })
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
  return isMoreThanMonth.value ? 'SPENT THIS TERM' : 'SPENT THIS MONTH'
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

// Calculate daily income amounts (for positive area)
const dailyIncomeAmounts = computed(() => {
  return props.dailyIncome.length > 0 ? props.dailyIncome : []
})

// Calculate daily expense amounts (for negative area)
const dailyExpenseAmounts = computed(() => {
  return props.dailyExpenses.length > 0 ? props.dailyExpenses : []
})

// Calculate cumulative cash flow (income - expenses over time)
const cumulativeCashFlow = computed(() => {
  const incomeData = dailyIncomeAmounts.value
  const expensesData = dailyExpenseAmounts.value
  const days = Math.max(incomeData.length, expensesData.length)
  
  if (days === 0) return []
  
  let cumulative = []
  let balance = 0
  
  for (let i = 0; i < days; i++) {
    const income = incomeData[i] || 0
    const expense = expensesData[i] || 0
    balance += income - expense
    cumulative.push(balance)
  }
  
  // Always normalize to match monthlyBalance (from store or props) if available
  if (cumulative.length === 0) return []
  
  const finalValue = cumulative[cumulative.length - 1] || 0
  const targetBalance = monthlyBalance.value
  
  // Always normalize if we have a target balance and the values don't match
  if (targetBalance !== 0 && finalValue !== 0 && Math.abs(finalValue - targetBalance) > 0.001) {
    // Normalize to match monthly balance exactly
    const ratio = targetBalance / finalValue
    cumulative = cumulative.map((val) => {
      const normalized = val * ratio
      // Round to 2 decimal places for precision
      return Math.round(normalized * 100) / 100
    })
    // Ensure the last value is exactly the target (fix any rounding errors)
    if (cumulative.length > 0) {
      cumulative[cumulative.length - 1] = targetBalance
    }
  }
  
  return cumulative
})

// Calculate cumulative income (for purple area above zero line)
const cumulativeIncome = computed(() => {
  const incomeData = dailyIncomeAmounts.value

  if (incomeData.length === 0) return []

  let cumulative = []
  let sum = 0

  // Use only the actual income data length
  for (let i = 0; i < incomeData.length; i++) {
    const income = incomeData[i] || 0
    sum += income
    cumulative.push(sum)
  }

  // Ensure the final value matches monthlyIncome (from store or props)
  const finalValue = cumulative[cumulative.length - 1] || 0
  const targetIncome = monthlyIncome.value
  if (targetIncome > 0 && Math.abs(finalValue - targetIncome) > 0.01) {
    // Normalize to match monthly total
    const ratio = targetIncome / finalValue
    cumulative = cumulative.map((val) => val * ratio)
  }

  return cumulative
})

// Calculate cumulative expenses (for red area overlapping with income)
const cumulativeExpenses = computed(() => {
  const expensesData = dailyExpenseAmounts.value

  if (expensesData.length === 0) return []

  let cumulative = []
  let sum = 0

  // Use only the actual expenses data length
  for (let i = 0; i < expensesData.length; i++) {
    const expense = expensesData[i] || 0
    sum += expense
    cumulative.push(sum) // Positive to overlap with income
  }

  // Ensure the final value matches monthlyExpenses (from store or props)
  const finalValue = cumulative[cumulative.length - 1] || 0
  const targetExpenses = monthlyExpenses.value
  if (targetExpenses > 0 && Math.abs(finalValue - targetExpenses) > 0.01) {
    // Normalize to match monthly total
    const ratio = targetExpenses / finalValue
    cumulative = cumulative.map((val) => val * ratio)
  }

  return cumulative
})

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
  const hasIncomeData = props.dailyIncome.length > 0
  const hasExpensesData = props.dailyExpenses.length > 0

  const datasets = []

  // If we have income/expense data, show overlapping cash flow visualization
  if (hasIncomeData || hasExpensesData) {
    // Get the maximum length to ensure all arrays are aligned
    const maxLength = Math.max(
      cumulativeIncome.value.length,
      cumulativeExpenses.value.length,
      cumulativeCashFlow.value.length,
      dateLabels.value.length,
    )

    // Pad arrays to maxLength to ensure alignment
    const padArray = (arr, length, fillValue) => {
      if (arr.length >= length) return arr.slice(0, length)
      return [...arr, ...new Array(length - arr.length).fill(fillValue)]
    }

    const incomeData = padArray(cumulativeIncome.value, maxLength, cumulativeIncome.value[cumulativeIncome.value.length - 1] || 0)
    const expensesData = padArray(cumulativeExpenses.value, maxLength, cumulativeExpenses.value[cumulativeExpenses.value.length - 1] || 0)
    const cashFlowData = padArray(cumulativeCashFlow.value, maxLength, cumulativeCashFlow.value[cumulativeCashFlow.value.length - 1] || 0)

    // Income dataset (purple, cumulative from zero, trending up)
    if (hasIncomeData) {
      datasets.push({
        label: 'Income',
        data: incomeData,
        borderColor: '#a855f7',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx
          const chart = context.chart
          const gradient = ctx.createLinearGradient(
            0,
            chart.chartArea.top,
            0,
            chart.chartArea.bottom,
          )
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.6)')
          gradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.4)')
          gradient.addColorStop(1, 'rgba(126, 34, 206, 0.2)')
          return gradient
        },
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#a855f7',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
        tension: 0.4,
        fill: true,
        order: 1, // Draw first (behind expenses)
      })
    }

    // Expenses dataset (red, cumulative from zero, overlapping with income)
    if (hasExpensesData) {
      datasets.push({
        label: 'Expenses',
        data: expensesData,
        borderColor: '#ef4444',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx
          const chart = context.chart
          const gradient = ctx.createLinearGradient(
            0,
            chart.chartArea.top,
            0,
            chart.chartArea.bottom,
          )
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.6)')
          gradient.addColorStop(0.5, 'rgba(220, 38, 38, 0.4)')
          gradient.addColorStop(1, 'rgba(185, 28, 28, 0.2)')
          return gradient
        },
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#ef4444',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
        tension: 0.4,
        fill: true,
        order: 2, // Draw on top of income (creates overlap)
      })
    }
    
    // Cash flow line (white line showing net balance over time)
    if (hasIncomeData || hasExpensesData) {
      datasets.push({
        label: 'Cash Flow',
        data: cashFlowData,
        borderColor: '#ffffff',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#a855f7',
        pointHoverBorderWidth: 2,
        tension: 0.4,
        fill: false,
        order: 3, // Draw on top of everything
      })
    }
  } else {
    // Fallback to old behavior if no income/expense data
    const data = props.spentData.length > 0 ? props.spentData : generateMockData()
    let cumulative = []
    let sum = 0
    data.forEach((amount) => {
      sum += amount
      cumulative.push(sum)
    })

    datasets.push({
      label: 'This period',
      data: cumulative,
      borderColor: '#a855f7',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx
        const gradient = ctx.createLinearGradient(0, 0, 0, 300)
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.3)')
        gradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.15)')
        gradient.addColorStop(1, 'rgba(126, 34, 206, 0.05)')
        return gradient
      },
      borderWidth: 3,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#a855f7',
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 2,
      tension: 0.4,
      fill: true,
    })
  }

  return {
    labels: dateLabels.value,
    datasets,
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
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
          // Show every nth label based on data length to avoid crowding
          const labels = dateLabels.value
          if (labels.length <= 7) {
            return labels[index] || ''
          }
          const step = Math.ceil(labels.length / 7) // Show approximately 7 labels
          if (index % step === 0 || index === labels.length - 1) {
            return labels[index] || ''
          }
          return ''
        },
      },
    },
    y: {
      display: true,
      beginAtZero: true,
      grid: {
        display: true,
        color: 'rgba(255, 255, 255, 0.1)',
        drawBorder: false,
        lineWidth: 1,
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
        font: {
          size: 11,
        },
        callback: function (value) {
          return '$' + value.toLocaleString()
        },
      },
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
  background: rgba(40, 40, 45, 0.95) !important;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  margin-bottom: 1.5rem;

  :deep(.q-card__section) {
    padding: 1.5rem 1.5rem 1.25rem;
  }
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.chart-header-left,
.chart-header-right {
  display: flex;
  flex-direction: column;
}

.chart-header-right {
  align-items: flex-end;
  text-align: right;
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

.chart-amount {
  color: white;
  font-size: 2.75rem;
  font-weight: 700;
  margin: 0;
  line-height: 1;
  letter-spacing: -1px;

  &.negative {
    color: var(--color-negative);
  }
}

.chart-wrapper {
  height: 180px;
  margin: 1rem 0 0.75rem;
  position: relative;
}

.chart-legend {
  display: flex;
  gap: 1.5rem;
  justify-content: flex-start;
  padding: 0.5rem 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;

  &.purple {
    background: #a855f7;
  }

  &.gray {
    background: rgba(156, 163, 175, 0.5);
  }

  &.red {
    background: #ef4444;
  }
}

.legend-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  font-weight: 400;
}

// Snapshot Section
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
  justify-content: center;
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
  }

  .profile-select {
    max-width: 300px;
    width: 100%;
  }
}
</style>
