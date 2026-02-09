import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCalendarStore } from 'src/stores/calendar.js'
import { useEventsStore } from 'src/stores/events.js'

vi.mock('axios')
vi.mock('src/js/api.js', () => ({ getAPIURL: () => 'https://test.example' }))

describe('calendar store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('has correct initial state', () => {
    const store = useCalendarStore()
    expect(store.currentDate).toBeInstanceOf(Date)
    expect(store.selectedProfile).toBe(null)
    expect(store.profile).toBe(null)
    expect(store.calendarVersion).toBe(0)
    expect(store.calendarDays).toEqual([])
  })

  it('currentMonthYear returns month and year string', () => {
    const store = useCalendarStore()
    store.currentDate = new Date(2025, 0, 15) // January 2025
    expect(store.currentMonthYear).toMatch(/January/)
    expect(store.currentMonthYear).toMatch(/2025/)
  })

  it('getEventDisplayAmount returns amount for non-loan event', () => {
    const store = useCalendarStore()
    const event = { category: 'GROCERY', amount: 75 }
    expect(store.getEventDisplayAmount(event)).toBe(75)
  })

  it('getEventDisplayAmount returns monthly_payment for loan without escrow', () => {
    const store = useCalendarStore()
    const event = {
      category: 'AUTO_LOAN',
      monthly_payment: 350,
      amount: 5000,
    }
    expect(store.getEventDisplayAmount(event)).toBe(350)
  })

  it('getEventDisplayAmount returns payment + escrow for MORTGAGE', () => {
    const store = useCalendarStore()
    const event = {
      category: 'MORTGAGE',
      monthly_payment: 1500,
      escrow: 300,
      amount: 1800,
    }
    expect(store.getEventDisplayAmount(event)).toBe(1800)
  })

  it('calendarDaysDebitTotal and calendarDaysCreditTotal are 0 when no days', () => {
    const store = useCalendarStore()
    expect(store.calendarDaysDebitTotal).toBe(0)
    expect(store.calendarDaysCreditTotal).toBe(0)
  })

  it('calendarDaysDebitTotal sums DEBIT events in current month days', () => {
    const store = useCalendarStore()
    store.calendarDays = [
      {
        currentMonth: true,
        events: [
          { type: 'DEBIT', amount: 100, category: 'GROCERY' },
          { type: 'CREDIT', amount: 50 },
        ],
      },
    ]
    expect(store.calendarDaysDebitTotal).toBe(100)
  })

  it('calendarDaysCreditTotal sums CREDIT events in current month days', () => {
    const store = useCalendarStore()
    store.calendarDays = [
      {
        currentMonth: true,
        events: [
          { type: 'CREDIT', amount: 200, category: 'PRIMARY_INCOME' },
          { type: 'DEBIT', amount: 50 },
        ],
      },
    ]
    expect(store.calendarDaysCreditTotal).toBe(200)
  })

  it('netFlow is credit total minus debit total', () => {
    const store = useCalendarStore()
    store.calendarDays = [
      { currentMonth: true, events: [{ type: 'CREDIT', amount: 300 }] },
      { currentMonth: true, events: [{ type: 'DEBIT', amount: 100 }] },
    ]
    expect(store.netFlow).toBe(200)
  })

  it('resetCalendar resets currentDate, calendarDays and version', () => {
    const store = useCalendarStore()
    store.currentDate = new Date(2020, 5, 1)
    store.calendarDays = [{ day: 1 }]
    store.calendarVersion = 5
    store.resetCalendar()
    expect(store.currentDate).toBeInstanceOf(Date)
    expect(store.calendarDays).toEqual([])
    expect(store.calendarVersion).toBe(0)
  })

  it('updateCalendarDays builds calendarDays (structure)', () => {
    setActivePinia(createPinia())
    const eventsStore = useEventsStore()
    eventsStore.eventsByMonth = []
    const calendarStore = useCalendarStore()
    calendarStore.currentDate = new Date(2025, 1, 15) // Feb 2025
    calendarStore.updateCalendarDays()
    expect(Array.isArray(calendarStore.calendarDays)).toBe(true)
    expect(calendarStore.calendarDays.length).toBeGreaterThan(0)
    const currentMonthDays = calendarStore.calendarDays.filter((d) => d.currentMonth)
    expect(currentMonthDays.length).toBe(28)
    expect(calendarStore.calendarDays[0]).toHaveProperty('day')
    expect(calendarStore.calendarDays[0]).toHaveProperty('currentMonth')
    expect(calendarStore.calendarDays[0]).toHaveProperty('date')
    expect(calendarStore.calendarDays[0]).toHaveProperty('events')
  })
})
