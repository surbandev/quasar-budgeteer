import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useCalendarStore } from './calendar'
import { useScenariosStore } from './scenarios'
import { useEventsStore } from './events'
import { aggregateDailyTotals } from '../js/dailyTotals'

// Session cache for the Home (Overview) screen. It holds the last rendered
// snapshot so navigating back to Home is instant, and exposes a `preload` action
// that warms the default view right after sign-in.
export const useOverviewStore = defineStore('overview', () => {
  const ready = ref(false)
  const loading = ref(false)
  const profileId = ref(null)

  const combinedActiveEvents = ref([])
  const dailyIncome = ref([])
  const dailyExpenses = ref([])
  const dailySpending = ref([])
  const range = ref(null)
  const quickRangePreset = ref('month')
  const isOneYearView = ref(false)
  const activeScenarios = ref(['default'])

  function isFreshFor(id) {
    return ready.value && profileId.value != null && String(profileId.value) === String(id)
  }

  function save(snapshot) {
    profileId.value = snapshot.profileId ?? null
    combinedActiveEvents.value = snapshot.combinedActiveEvents || []
    dailyIncome.value = snapshot.dailyIncome || []
    dailyExpenses.value = snapshot.dailyExpenses || []
    dailySpending.value = snapshot.dailySpending || []
    range.value = snapshot.range || null
    quickRangePreset.value = snapshot.quickRangePreset || 'month'
    isOneYearView.value = !!snapshot.isOneYearView
    activeScenarios.value = snapshot.activeScenarios || ['default']
    ready.value = true
  }

  // Mark the cache stale (e.g. after a transaction is added/edited/deleted) so
  // the next Home visit refetches.
  function invalidate() {
    ready.value = false
  }

  function clear() {
    ready.value = false
    loading.value = false
    profileId.value = null
    combinedActiveEvents.value = []
    dailyIncome.value = []
    dailyExpenses.value = []
    dailySpending.value = []
    range.value = null
    quickRangePreset.value = 'month'
    isOneYearView.value = false
    activeScenarios.value = ['default']
  }

  // Fetch + aggregate the default Home view (current month, default scenario) and
  // store it, so the Overview can render immediately on first navigation.
  async function preload(profile) {
    if (!profile?.id) return

    loading.value = true
    try {
      const calendarStore = useCalendarStore()
      const scenariosStore = useScenariosStore()
      const eventsStore = useEventsStore()

      calendarStore.setProfile(profile)
      scenariosStore.setProfile(profile)
      eventsStore.setProfile(profile)

      await scenariosStore.fetchScenarios()
      await scenariosStore.selectDefaultScenario()

      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      await eventsStore.fetchEventsForDateRange(start, end)
      const events = await eventsStore.getAllActiveScenarioEvents(['default'], start, end)
      eventsStore.setFilteredEvents(events)

      const totals = aggregateDailyTotals(events, start, end)

      save({
        profileId: profile.id,
        combinedActiveEvents: events,
        dailyIncome: totals.dailyIncome,
        dailyExpenses: totals.dailyExpenses,
        dailySpending: totals.dailySpending,
        range: {
          startMonth: now.getMonth() + 1,
          startDay: 1,
          startYear: now.getFullYear(),
          endMonth: now.getMonth() + 1,
          endDay: end.getDate(),
          endYear: now.getFullYear(),
        },
        quickRangePreset: 'month',
        isOneYearView: false,
        activeScenarios: ['default'],
      })
    } catch (error) {
      console.error('Overview preload failed:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    ready,
    loading,
    profileId,
    combinedActiveEvents,
    dailyIncome,
    dailyExpenses,
    dailySpending,
    range,
    quickRangePreset,
    isOneYearView,
    activeScenarios,
    isFreshFor,
    save,
    invalidate,
    clear,
    preload,
  }
})
