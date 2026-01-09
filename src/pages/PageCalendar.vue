<template>
  <q-page class="calendar-page">
    <div class="calendar-layout">
      <!-- Sidebar with Cash Flow Summary -->
      <div class="calendar-sidebar glass-card">
        <q-btn
          flat
          dense
          icon="arrow_back"
          label="Back to Dashboard"
          class="q-mb-md"
          @click="goBackToDashboard"
          no-caps
        />

        <div class="cash-flow-summary q-mb-lg">
          <h3 class="section-title">Cash Flow Summary</h3>
          <div class="cash-flow-item">
            <div class="flow-label">Cash Flow IN</div>
            <div class="flow-amount positive text-positive">
              ${{ calendarDaysCreditTotal.toFixed(2) }}
            </div>
          </div>
          <div class="cash-flow-item">
            <div class="flow-label">Cash Flow OUT</div>
            <div class="flow-amount negative text-negative">
              ${{ calendarDaysDebitTotal.toFixed(2) }}
            </div>
          </div>
          <div class="cash-flow-item total">
            <div class="flow-label">Net Flow</div>
            <div
              class="flow-amount"
              :class="netFlow >= 0 ? 'text-positive' : 'text-negative'"
            >
              ${{ netFlow.toFixed(2) }}
            </div>
          </div>
        </div>

        <!-- Active Scenario Section -->
        <div class="scenarios-section q-mb-lg">
          <h3 class="section-title">Active Scenario</h3>

          <div class="scenarios-header q-mb-md">
            <q-icon name="layers" class="scenarios-icon" />
            <span class="scenarios-subtitle">Select a scenario to display on the calendar</span>
          </div>

          <div class="scenario-dropdown-container">
            <q-btn
              flat
              dense
              :label="`Current: ${selectedScenario?.name || 'None'}`"
              icon="expand_more"
              class="full-width scenario-dropdown-trigger"
              @click="showScenarioDropdown = !showScenarioDropdown"
            />

            <q-menu v-model="showScenarioDropdown">
              <q-list style="min-width: 200px">
                <q-item
                  v-for="scenario in allScenarios"
                  :key="scenario.id"
                  clickable
                  v-close-popup
                  @click="handleScenarioSelection(scenario)"
                  :active="selectedScenario?.id === scenario.id"
                >
                  <q-item-section>
                    <q-item-label>{{ scenario.name }}</q-item-label>
                  </q-item-section>
                  <q-item-section side v-if="selectedScenario?.id === scenario.id">
                    <q-icon name="check_circle" color="positive" />
                  </q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-close-popup @click="handleCreateScenario">
                  <q-item-section avatar>
                    <q-icon name="add" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Create New Scenario</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </div>
        </div>

        <div class="quick-actions">
          <h3 class="section-title">Quick Add</h3>
          <q-btn
            color="primary"
            label="Add Transaction"
            class="full-width"
            @click="goToAddTransaction('add')"
            no-caps
          />
        </div>
      </div>

      <!-- Calendar -->
      <div class="calendar-main">
        <q-card class="glass-card">
          <q-card-section>
            <div class="calendar-header">
              <q-btn
                flat
                dense
                round
                icon="chevron_left"
                @click="handlePreviousMonth"
              />
              <h2 class="month-title">{{ currentMonthYear }}</h2>
              <q-btn
                flat
                dense
                round
                icon="chevron_right"
                @click="handleNextMonth"
              />
            </div>

            <div class="calendar-grid-wrapper">
              <!-- Day headers -->
              <div class="calendar-grid">
                <div
                  v-for="day in daysOfWeek"
                  :key="day"
                  class="calendar-day-header"
                >
                  {{ day }}
                </div>

                <!-- Calendar days -->
                <div
                  v-for="date in calendarDays"
                  :key="`${date.date.getTime()}-${date.currentMonth ? 'current' : 'other'}`"
                  class="calendar-day-cell"
                  :class="{
                    'current-month': date.currentMonth,
                    'has-events': date.hasEvents,
                    today: date.isToday,
                    transitioning: isTransitioning,
                  }"
                >
                  <div class="day-number">{{ date.day }}</div>
                  <div v-if="date.events && date.events.length > 0" class="event-details">
                    <div
                      v-for="(event, index) in date.events"
                      :key="index"
                      class="event-item"
                      :class="event.type === 'CREDIT' ? 'positive' : 'negative'"
                      @click="goToAddTransaction(event)"
                    >
                      <div class="event-name">{{ event.name }}</div>
                      <div class="event-amount">${{ getEventDisplayAmount(event) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCalendarStore } from '../stores/calendar'
import { useScenariosStore } from '../stores/scenarios'
import { useEventsStore } from '../stores/events'

const router = useRouter()
const calendarStore = useCalendarStore()
const scenariosStore = useScenariosStore()
const eventsStore = useEventsStore()

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const isTransitioning = ref(false)
const showScenarioDropdown = ref(false)
const isInitializing = ref(false)

const netFlow = computed(() => calendarStore.netFlow)
const currentMonthYear = computed(() => calendarStore.currentMonthYear)
const profile = computed(() => calendarStore.profile)
const calendarDays = computed(() => calendarStore.calendarDays)
const calendarDaysDebitTotal = computed(() => calendarStore.calendarDaysDebitTotal)
const calendarDaysCreditTotal = computed(() => calendarStore.calendarDaysCreditTotal)

const allScenarios = computed(() => scenariosStore.allScenarios)
const selectedScenario = computed(() => scenariosStore.selectedScenario)
const hasScenarios = computed(() => scenariosStore.hasScenarios)

const monthlyEvents = computed(() => eventsStore.monthlyEvents)

function getEventDisplayAmount(event) {
  if (event.amount !== undefined && event.amount !== null) {
    return event.amount
  }

  const loanCategories = ['MORTGAGE', 'GENERIC_LOAN', 'AUTO_LOAN']
  if (
    loanCategories.includes(event.category) &&
    event.monthly_payment &&
    event.monthly_payment > 0
  ) {
    if (event.category === 'MORTGAGE' && event.escrow && event.escrow > 0) {
      return parseFloat(event.monthly_payment) + parseFloat(event.escrow)
    }
    return event.monthly_payment
  }
  return event.amount
}

function goToAddTransaction(event) {
  const query = {
    eventID: event && event.id ? event.id : undefined,
    profileID: profile.value.id,
    scenarioID: selectedScenario.value.id,
  }

  router.push({
    path: '/transaction',
    query: query,
  })
}

async function handlePreviousMonth() {
  isTransitioning.value = true
  await calendarStore.previousMonth()
  setTimeout(() => {
    isTransitioning.value = false
  }, 300)
}

async function handleNextMonth() {
  isTransitioning.value = true
  await calendarStore.nextMonth()
  setTimeout(() => {
    isTransitioning.value = false
  }, 300)
}

function goToCreateScenarioPage() {
  router.push({
    path: '/create-scenario',
    query: { profileID: profile.value?.id },
  })
}

function handleScenarioSelection(scenario) {
  scenariosStore.selectScenario(scenario)
}

function handleCreateScenario() {
  goToCreateScenarioPage()
}

async function goBackToDashboard() {
  try {
    await scenariosStore.selectDefaultScenario()
  } catch (error) {
    console.error('Error resetting to default scenario:', error)
  }

  router.push('/dashboard')
}

async function initializeCalendar() {
  if (isInitializing.value) return
  isInitializing.value = true

  try {
    if (!profile.value || !selectedScenario.value) {
      const profileID = router.currentRoute.value.query.profileID || localStorage.getItem('userID')
      if (profileID) {
        await calendarStore.fetchProfileInfo(profileID)

        if (!hasScenarios.value) {
          await scenariosStore.fetchScenarios()
        }

        const routeScenarioID = router.currentRoute.value.query.scenarioID
        if (routeScenarioID && hasScenarios.value) {
          const targetScenario = allScenarios.value.find((s) => s.id === routeScenarioID)
          if (targetScenario) {
            await scenariosStore.selectScenario(targetScenario)
          } else {
            await scenariosStore.selectDefaultScenario()
          }
        } else if (!selectedScenario.value && hasScenarios.value) {
          await scenariosStore.selectDefaultScenario()
        }

        if (selectedScenario.value) {
          await eventsStore.fetchEventsForMonthByScenario()
          calendarStore.updateCalendarDays()
        } else {
          console.error('No scenario selected, cannot fetch events')
        }
      }
    } else {
      const routeScenarioID = router.currentRoute.value.query.scenarioID
      if (routeScenarioID && routeScenarioID !== selectedScenario.value.id) {
        const targetScenario = allScenarios.value.find((s) => s.id === routeScenarioID)
        if (targetScenario) {
          await scenariosStore.selectScenario(targetScenario)
          await eventsStore.fetchEventsForMonthByScenario()
          calendarStore.updateCalendarDays()
        }
      } else {
        await eventsStore.fetchEventsForMonthByScenario()
        calendarStore.updateCalendarDays()
      }
    }

    console.log('=== CALENDAR PAGE LOADED ===')
    console.log('Active Scenario:', selectedScenario.value?.name || 'None')
    console.log('Events loaded for scenario:', monthlyEvents.value || [])
    console.log('=== END CALENDAR PAGE LOADED ===')
  } finally {
    isInitializing.value = false
  }
}

onMounted(async () => {
  await initializeCalendar()
})

watch(
  selectedScenario,
  async (newVal, oldVal) => {
    if (newVal && newVal.id && oldVal && newVal.id !== oldVal.id) {
      await eventsStore.fetchEventsForMonthByScenario()
      calendarStore.updateCalendarDays()
      console.log('=== SCENARIO CHANGED ===')
      console.log('New Active Scenario:', newVal.name || 'None')
      console.log('Events loaded for scenario:', monthlyEvents.value || [])
      console.log('=== END SCENARIO CHANGED ===')
    }
  },
  { immediate: false }
)

watch(
  monthlyEvents,
  (newVal, oldVal) => {
    if (newVal && Array.isArray(newVal) && newVal.length > 0) {
      if (!oldVal || JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
        calendarStore.updateCalendarDays()
      }
    }
  },
  { immediate: false }
)
</script>

<style scoped lang="scss">
.calendar-page {
  padding: 2rem;
  min-height: 100vh;
}

.calendar-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.calendar-sidebar {
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 2rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cash-flow-summary {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.cash-flow-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }

  &.total {
    margin-top: 0.5rem;
    padding-top: 1rem;
    border-top: 2px solid rgba(255, 255, 255, 0.2);
    border-bottom: none;
  }
}

.flow-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.flow-amount {
  font-size: 1.2rem;
  font-weight: 700;

  &.positive {
    color: #4caf50;
  }

  &.negative {
    color: #f44336;
  }
}

.scenarios-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.scenarios-icon {
  font-size: 1.5rem;
  color: rgba(33, 150, 243, 0.8);
}

.scenarios-subtitle {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.scenario-dropdown-trigger {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
  text-align: left;
  justify-content: space-between;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.calendar-main {
  overflow: hidden;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.month-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.calendar-grid-wrapper {
  overflow-x: auto;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  min-width: 700px;
}

.calendar-day-header {
  text-align: center;
  padding: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}

.calendar-day-cell {
  min-height: 100px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.has-events {
    background: rgba(33, 150, 243, 0.15);
    border: 1px solid rgba(33, 150, 243, 0.3);
  }

  &.today {
    background: rgba(76, 175, 80, 0.2);
    border: 2px solid #4caf50;
  }

  &:not(.current-month) {
    opacity: 0.4;
  }

  &.transitioning {
    opacity: 0.6;
  }
}

.day-number {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.event-item {
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 0.75rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }

  &.positive {
    border-left: 3px solid #4caf50;
  }

  &.negative {
    border-left: 3px solid #f44336;
  }
}

.event-name {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-amount {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

@media (max-width: 1200px) {
  .calendar-layout {
    grid-template-columns: 1fr;
  }

  .calendar-sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .calendar-page {
    padding: 1rem;
  }

  .calendar-day-cell {
    min-height: 80px;
  }

  .month-title {
    font-size: 1.4rem;
  }
}
</style>
