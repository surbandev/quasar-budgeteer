<template>
  <q-page class="compare-page">
    <div class="compare-container">
      <header class="compare-header">
        <q-btn
          flat
          dense
          round
          icon="arrow_back"
          color="white"
          aria-label="Back"
          @click="goBack"
        />
        <div class="compare-heading">
          <h1 class="compare-title">Compare scenarios</h1>
          <p class="compare-subtitle">See how each what-if changes your monthly plan.</p>
        </div>
      </header>

      <div class="month-bar glass-card">
        <q-btn flat dense round icon="chevron_left" color="white" aria-label="Previous month" @click="shiftMonth(-1)" />
        <div class="month-label">{{ monthLabel }}</div>
        <q-btn flat dense round icon="chevron_right" color="white" aria-label="Next month" @click="shiftMonth(1)" />
      </div>

      <div v-if="loading" class="compare-loading">
        <q-spinner color="primary" size="42px" />
        <span>Crunching your plans…</span>
      </div>

      <div v-else-if="comparisons.length === 0" class="compare-empty glass-card">
        <q-icon name="layers" size="40px" />
        <p>No scenarios to compare yet.</p>
        <q-btn color="primary" no-caps label="Create a scenario" @click="goToCreateScenario" />
      </div>

      <div v-else class="compare-grid">
        <article
          v-for="row in comparisons"
          :key="row.id"
          class="scenario-card glass-card"
          :class="{ 'is-base': row.isBase }"
        >
          <div class="scenario-card-head">
            <div class="scenario-name-wrap">
              <q-icon :name="row.isBase ? 'home' : 'layers'" size="20px" />
              <span class="scenario-name">{{ row.name }}</span>
            </div>
            <span v-if="row.isBase" class="base-badge">Base plan</span>
            <span
              v-else
              class="net-badge"
              :class="row.delta.net >= 0 ? 'pos' : 'neg'"
            >
              {{ signed(row.delta.net) }} / mo
            </span>
          </div>

          <div class="metric-list">
            <div class="metric-row">
              <span class="metric-label">Income</span>
              <span class="metric-value">{{ money(row.summary.income) }}</span>
              <span v-if="!row.isBase" class="metric-delta" :class="deltaClass(row.delta.income)">
                {{ signed(row.delta.income) }}
              </span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Expenses</span>
              <span class="metric-value">{{ money(row.summary.expenses) }}</span>
              <span v-if="!row.isBase" class="metric-delta" :class="deltaClass(-row.delta.expenses)">
                {{ signed(row.delta.expenses) }}
              </span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Savings</span>
              <span class="metric-value">{{ money(row.summary.savings) }}</span>
              <span v-if="!row.isBase" class="metric-delta" :class="deltaClass(row.delta.savings)">
                {{ signed(row.delta.savings) }}
              </span>
            </div>
            <q-separator dark class="q-my-sm" />
            <div class="metric-row net-row">
              <span class="metric-label">Net cash flow</span>
              <span class="metric-value" :class="row.summary.net >= 0 ? 'text-positive' : 'text-negative'">
                {{ money(row.summary.net) }}
              </span>
              <span v-if="!row.isBase" class="metric-delta" :class="deltaClass(row.delta.net)">
                {{ signed(row.delta.net) }}
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '../stores/profile'
import { useCalendarStore } from '../stores/calendar'
import { useScenariosStore } from '../stores/scenarios'
import { useEventsStore } from '../stores/events'
import { diffSummary } from '../js/scenarioSummary'

const router = useRouter()
const profileStore = useProfileStore()
const calendarStore = useCalendarStore()
const scenariosStore = useScenariosStore()
const eventsStore = useEventsStore()

const loading = ref(true)
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth())
const summaries = ref({})

const currentProfile = computed(() => profileStore.currentProfile)
const allScenarios = computed(() => scenariosStore.allScenarios)

const monthLabel = computed(() =>
  new Date(year.value, month.value, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
)

// Base plan first (the scenario named "default"), then each what-if with deltas.
const comparisons = computed(() => {
  const scenarios = allScenarios.value || []
  if (scenarios.length === 0) return []

  const base = scenarios.find((s) => s.name?.toLowerCase() === 'default') || scenarios[0]
  const baseSummary = summaries.value[base.id] || { income: 0, expenses: 0, savings: 0, net: 0 }

  const ordered = [base, ...scenarios.filter((s) => s.id !== base.id)]

  return ordered.map((scenario) => {
    const summary = summaries.value[scenario.id] || { income: 0, expenses: 0, savings: 0, net: 0 }
    const isBase = scenario.id === base.id
    return {
      id: scenario.id,
      name: isBase ? `${scenario.name} (Base)` : scenario.name,
      isBase,
      summary,
      delta: isBase ? null : diffSummary(summary, baseSummary),
    }
  })
})

function money(amount) {
  const value = Number(amount) || 0
  const formatted = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return value < 0 ? `-$${formatted}` : `$${formatted}`
}

function signed(amount) {
  const value = Number(amount) || 0
  if (value === 0) return '$0.00'
  const sign = value > 0 ? '+' : '-'
  return `${sign}$${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// A "good" delta (more money) is green, a "worse" one is red. Expenses pass a
// negated value so that lower expenses read as the positive (green) direction.
function deltaClass(value) {
  if (value > 0) return 'text-positive'
  if (value < 0) return 'text-negative'
  return 'text-grey-6'
}

async function computeSummaries() {
  if (!currentProfile.value || allScenarios.value.length === 0) {
    summaries.value = {}
    return
  }

  loading.value = true
  try {
    const start = new Date(Date.UTC(year.value, month.value, 1))
    const end = new Date(Date.UTC(year.value, month.value + 1, 0))

    const results = await Promise.all(
      allScenarios.value.map(async (scenario) => {
        const summary = await eventsStore.summarizeScenarioForRange(scenario.id, start, end)
        return [scenario.id, summary]
      }),
    )

    summaries.value = Object.fromEntries(results)
  } catch (error) {
    console.error('Error computing scenario comparison:', error)
  } finally {
    loading.value = false
  }
}

function shiftMonth(delta) {
  const next = new Date(year.value, month.value + delta, 1)
  year.value = next.getFullYear()
  month.value = next.getMonth()
}

function goBack() {
  router.push('/overview')
}

function goToCreateScenario() {
  router.push({ path: '/create-scenario', query: { profileID: currentProfile.value?.id } })
}

async function initialize() {
  try {
    const token = localStorage.getItem('token')
    const userID = localStorage.getItem('userID')
    if (!token || !userID) {
      router.push('/login')
      return
    }

    const resolvedProfile = await profileStore.resolveInitialProfile()
    if (!resolvedProfile) {
      router.push('/login')
      return
    }

    calendarStore.setProfile(currentProfile.value)
    scenariosStore.setProfile(currentProfile.value)
    eventsStore.setProfile(currentProfile.value)

    await scenariosStore.fetchScenarios()
    await scenariosStore.selectDefaultScenario()

    await computeSummaries()
  } catch (error) {
    console.error('Error initializing scenario comparison:', error)
    router.push('/overview')
  } finally {
    loading.value = false
  }
}

watch([year, month], computeSummaries)

watch(currentProfile, async (profile) => {
  if (!profile) return
  scenariosStore.setProfile(profile)
  eventsStore.setProfile(profile)
  await scenariosStore.fetchScenarios()
  await computeSummaries()
})

onMounted(initialize)
</script>

<style scoped lang="scss">
.compare-page {
  padding: 1rem;
  min-height: 100vh;
  background: var(--page-bg);
}

.compare-container {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  backdrop-filter: blur(12px);
}

.compare-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.compare-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  line-height: 1.2;
}

.compare-subtitle {
  margin: 0.15rem 0 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.month-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.75rem;
}

.month-label {
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
}

.compare-loading,
.compare-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem 1rem;
  color: rgba(255, 255, 255, 0.7);
}

.compare-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.scenario-card {
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &.is-base {
    border-color: rgba(33, 150, 243, 0.5);
  }
}

.scenario-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.scenario-name-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  min-width: 0;
}

.scenario-name {
  font-weight: 600;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.base-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(33, 150, 243, 0.2);
  color: #64b5f6;
  white-space: nowrap;
}

.net-badge {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  white-space: nowrap;

  &.pos {
    background: rgba(76, 175, 80, 0.18);
    color: #81c784;
  }

  &.neg {
    background: rgba(244, 67, 54, 0.18);
    color: #e57373;
  }
}

.metric-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.metric-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: baseline;
  gap: 0.5rem;
}

.metric-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.metric-value {
  color: #fff;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.metric-delta {
  font-size: 0.8rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 4.5rem;
  text-align: right;
}

.net-row .metric-label {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}
</style>
