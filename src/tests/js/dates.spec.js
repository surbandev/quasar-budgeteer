import { describe, it, expect } from 'vitest'
import {
  fixDate,
  formatDate,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  addMonths,
  isSameDay,
} from 'src/js/dates.js'

describe('dates.js', () => {
  describe('fixDate', () => {
    it('returns value unchanged for null/undefined', () => {
      expect(fixDate(null)).toBe(null)
      expect(fixDate(undefined)).toBe(undefined)
    })

    it('converts Date to ISO string', () => {
      const d = new Date('2025-02-09T12:00:00.000Z')
      expect(fixDate(d)).toBe(d.toISOString())
    })

    it('parses ISO string and returns ISO', () => {
      const iso = '2025-02-09T00:00:00.000Z'
      const result = fixDate(iso)
      expect(result).toMatch(/2025-02-0[89]/) // UTC may become previous day in local TZ
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('parses SQL-style date', () => {
      expect(fixDate('2025-02-09 12:00:00')).toMatch(/2025-02-09/)
    })
  })

  describe('formatDate', () => {
    it('returns empty string for falsy value', () => {
      expect(formatDate(null)).toBe('')
      expect(formatDate(undefined)).toBe('')
    })

    it('formats ISO string with default format', () => {
      expect(formatDate('2025-02-09')).toBe('Feb 09, 2025')
    })

    it('accepts custom format', () => {
      expect(formatDate('2025-02-09', 'yyyy-MM-dd')).toBe('2025-02-09')
    })
  })

  describe('getFirstDayOfMonth', () => {
    it('returns first day of month', () => {
      const d = new Date(2025, 1, 15) // Feb 15
      const first = getFirstDayOfMonth(d)
      expect(first.getDate()).toBe(1)
      expect(first.getMonth()).toBe(1)
      expect(first.getFullYear()).toBe(2025)
    })
  })

  describe('getLastDayOfMonth', () => {
    it('returns last day of month', () => {
      const d = new Date(2025, 0, 15) // Jan 15
      const last = getLastDayOfMonth(d)
      expect(last.getDate()).toBe(31)
      expect(last.getMonth()).toBe(0)
    })

    it('returns last day for February in leap year', () => {
      const d = new Date(2024, 1, 1)
      const last = getLastDayOfMonth(d)
      expect(last.getDate()).toBe(29)
    })
  })

  describe('addMonths', () => {
    it('adds positive months', () => {
      const d = new Date(2025, 0, 15) // Jan 15
      const result = addMonths(d, 2)
      expect(result.getMonth()).toBe(2)
      expect(result.getDate()).toBe(15)
    })

    it('subtracts with negative months', () => {
      const d = new Date(2025, 2, 15)
      const result = addMonths(d, -2)
      expect(result.getMonth()).toBe(0)
      expect(result.getDate()).toBe(15)
    })
  })

  describe('isSameDay', () => {
    it('returns true for same day', () => {
      const a = new Date(2025, 1, 9, 8, 0)
      const b = new Date(2025, 1, 9, 20, 0)
      expect(isSameDay(a, b)).toBe(true)
    })

    it('returns false for different days', () => {
      const a = new Date(2025, 1, 9)
      const b = new Date(2025, 1, 10)
      expect(isSameDay(a, b)).toBe(false)
    })
  })
})
