import { hasLoadedEventsForMonth } from './monthEvents'

/**
 * Load events for a calendar month, reusing store data when Overview (or a prior
 * tab visit) already fetched a range that includes this month.
 */
export async function ensureMonthEvents(eventsStore, { month, year, setLoading }) {
  const date = new Date(year, month, 1)
  eventsStore.setCurrentDate(date)

  const canReuse =
    eventsStore.isMonthSnapshotFresh(date) ||
    hasLoadedEventsForMonth(month, year, eventsStore.filteredEvents)

  if (canReuse) {
    setLoading?.(false)
    return
  }

  setLoading?.(true)
  try {
    await eventsStore.fetchEventsForMonthByScenario()
  } finally {
    setLoading?.(false)
  }
}

export function syncMonthFromStore(eventsStore, selectedMonth, selectedYear) {
  const storeDate = eventsStore.getCurrentDate
  if (storeDate instanceof Date && !Number.isNaN(storeDate.getTime())) {
    selectedMonth.value = storeDate.getMonth()
    selectedYear.value = storeDate.getFullYear()
  }
}
