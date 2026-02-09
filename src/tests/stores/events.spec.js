import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEventsStore } from 'src/stores/events.js'

vi.mock('axios')
vi.mock('src/js/api.js', () => ({ getAPIURL: () => 'https://test.example' }))

describe('events store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('has correct initial state', () => {
    const store = useEventsStore()
    expect(store.events).toEqual([])
    expect(store.eventsByMonth).toEqual([])
    expect(store.filteredEvents).toEqual([])
    expect(store.combinedActiveEvents).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBe(null)
    expect(store.profile).toBe(null)
  })

  it('allEvents and monthlyEvents return state arrays', () => {
    const store = useEventsStore()
    store.events = [{ id: 1 }]
    store.eventsByMonth = [{ event: { id: 1 }, occurrences: [] }]
    expect(store.allEvents).toEqual([{ id: 1 }])
    expect(store.monthlyEvents).toHaveLength(1)
  })

  it('setProfile sets profile when valid', () => {
    const store = useEventsStore()
    const profile = { id: 1, name: 'P1' }
    store.setProfile(profile)
    expect(store.profile).toEqual(profile)
  })

  it('setCurrentDate sets currentDate when given Date', () => {
    const store = useEventsStore()
    const d = new Date(2025, 0, 15)
    store.setCurrentDate(d)
    expect(store.getCurrentDate).toEqual(d)
  })

  it('setCurrentDate falls back to new Date when given invalid value', () => {
    const store = useEventsStore()
    store.setCurrentDate(null)
    expect(store.currentDate).toBeInstanceOf(Date)
  })

  it('monthlyIncome uses getEventDisplayAmount for loan events (mortgage + escrow)', () => {
    const store = useEventsStore()
    store.combinedActiveEvents = [
      {
        type: 'CREDIT',
        amount: 100,
        category: 'PRIMARY_INCOME',
      },
      {
        type: 'DEBIT',
        category: 'MORTGAGE',
        monthly_payment: 1200,
        escrow: 200,
        amount: 1400,
      },
    ]
    expect(store.monthlyIncome).toBe(100)
    expect(store.monthlyExpenses).toBe(1400)
  })

  it('cashFlowInTotal sums CREDIT events', () => {
    const store = useEventsStore()
    store.events = [
      { type: 'CREDIT', amount: 100 },
      { type: 'DEBIT', amount: 50 },
      { type: 'CREDIT', amount: 200 },
    ]
    expect(store.cashFlowInTotal).toBe(300)
  })

  it('cashFlowOutTotal sums DEBIT events', () => {
    const store = useEventsStore()
    store.events = [
      { type: 'DEBIT', amount: 80 },
      { type: 'CREDIT', amount: 100 },
      { type: 'DEBIT', amount: 20 },
    ]
    expect(store.cashFlowOutTotal).toBe(100)
  })

  it('monthlyIncome uses combinedActiveEvents when set', () => {
    const store = useEventsStore()
    store.combinedActiveEvents = [
      { type: 'CREDIT', amount: 100 },
      { type: 'DEBIT', amount: 50 },
    ]
    expect(store.monthlyIncome).toBe(100)
  })

  it('monthlyExpenses excludes SAVINGS category', () => {
    const store = useEventsStore()
    store.combinedActiveEvents = [
      { type: 'DEBIT', category: 'GROCERY', amount: 50 },
      { type: 'DEBIT', category: 'SAVINGS', amount: 100 },
    ]
    expect(store.monthlyExpenses).toBe(50)
  })

  it('monthlySavings sums only SAVINGS category', () => {
    const store = useEventsStore()
    store.combinedActiveEvents = [
      { type: 'DEBIT', category: 'SAVINGS', amount: 100 },
      { type: 'DEBIT', category: 'GROCERY', amount: 50 },
    ]
    expect(store.monthlySavings).toBe(100)
  })

  it('cashFlow is monthlyIncome minus monthlyExpenses', () => {
    const store = useEventsStore()
    store.combinedActiveEvents = [
      { type: 'CREDIT', amount: 500 },
      { type: 'DEBIT', category: 'GROCERY', amount: 200 },
    ]
    expect(store.cashFlow).toBe(300)
  })

  it('reset clears events and loading/error', () => {
    const store = useEventsStore()
    store.events = [{ id: 1 }]
    store.eventsByMonth = [{}]
    store.filteredEvents = [{}]
    store.combinedActiveEvents = [{}]
    store.loading = true
    store.error = 'err'
    store.reset()
    expect(store.events).toEqual([])
    expect(store.eventsByMonth).toEqual([])
    expect(store.filteredEvents).toEqual([])
    expect(store.combinedActiveEvents).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBe(null)
  })

  it('resetForNewUser clears profile and events', () => {
    const store = useEventsStore()
    store.profile = { id: 1 }
    store.events = [{ id: 1 }]
    store.resetForNewUser()
    expect(store.profile).toBe(null)
    expect(store.events).toEqual([])
  })

  it('clearError sets error to null', () => {
    const store = useEventsStore()
    store.error = 'Failed'
    store.clearError()
    expect(store.error).toBe(null)
  })

  it('setFilteredEvents sets filteredEvents', () => {
    const store = useEventsStore()
    const evts = [{ id: 1, name: 'E1' }]
    store.setFilteredEvents(evts)
    expect(store.getFilteredEvents).toEqual(evts)
  })

  it('filterEventsByDateRange filters by date range', () => {
    const store = useEventsStore()
    const allEvents = [
      {
        event: { id: 1, name: 'E1' },
        occurrences: ['2025-02-01', '2025-02-15', '2025-03-01'],
      },
    ]
    const start = new Date(2025, 1, 1) // Feb 1
    const end = new Date(2025, 1, 28) // Feb 28
    store.filterEventsByDateRange(start, end, allEvents)
    expect(store.filteredEvents.length).toBe(2) // Feb 1 and Feb 15
    expect(
      store.filteredEvents.every((e) => e.date >= '2025-02-01' && e.date <= '2025-02-28'),
    ).toBe(true)
  })
})
