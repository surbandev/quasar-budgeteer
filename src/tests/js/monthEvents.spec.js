import { describe, it, expect } from 'vitest'
import {
  filterEventsForMonth,
  getLoadedEventsDateBounds,
  hasLoadedEventsForMonth,
  isMonthWithinLoadedBounds,
} from 'src/js/monthEvents.js'

describe('monthEvents', () => {
  const events = [
    { id: 1, date: '2025-06-01', type: 'DEBIT', amount: 10 },
    { id: 2, date: '2025-06-15', type: 'CREDIT', amount: 100 },
    { id: 3, date: '2025-07-02', type: 'DEBIT', amount: 20 },
  ]

  it('filterEventsForMonth returns only events in the requested month', () => {
    const june = filterEventsForMonth(events, 5, 2025)
    expect(june).toHaveLength(2)
    expect(june.map((e) => e.id)).toEqual([1, 2])
  })

  it('getLoadedEventsDateBounds returns min and max date keys', () => {
    expect(getLoadedEventsDateBounds(events)).toEqual({
      min: '2025-06-01',
      max: '2025-07-02',
    })
  })

  it('isMonthWithinLoadedBounds detects months covered by cached events', () => {
    expect(isMonthWithinLoadedBounds(5, 2025, events)).toBe(true)
    expect(isMonthWithinLoadedBounds(6, 2025, events)).toBe(true)
    expect(isMonthWithinLoadedBounds(4, 2025, events)).toBe(false)
  })

  it('hasLoadedEventsForMonth is true for empty months inside a loaded range', () => {
    const sparse = [{ id: 1, date: '2025-01-10' }, { id: 2, date: '2025-03-05' }]
    expect(hasLoadedEventsForMonth(1, 2025, sparse)).toBe(true)
    expect(hasLoadedEventsForMonth(2, 2025, sparse)).toBe(true)
    expect(hasLoadedEventsForMonth(3, 2025, sparse)).toBe(false)
  })
})
