import { describe, it, expect } from 'vitest'
import { currencyFormat, useAmountColorClass } from 'src/js/utils.js'

describe('utils.js', () => {
  describe('currencyFormat', () => {
    it('formats positive amounts with + and two decimals', () => {
      expect(currencyFormat(100)).toBe('+ $ 100.00')
      expect(currencyFormat(1234.5)).toBe('+ $ 1,234.50')
    })

    it('formats negative amounts with - and absolute value', () => {
      expect(currencyFormat(-50)).toBe('- $ 50.00')
      expect(currencyFormat(-999.99)).toBe('- $ 999.99')
    })

    it('formats zero with no sign', () => {
      expect(currencyFormat(0)).toBe(' $ 0.00')
    })

    it('uses en-US locale for thousands', () => {
      expect(currencyFormat(1234567.89)).toBe('+ $ 1,234,567.89')
    })
  })

  describe('useAmountColorClass', () => {
    it('returns text-positive for positive amounts', () => {
      expect(useAmountColorClass(1)).toBe('text-positive')
      expect(useAmountColorClass(0.01)).toBe('text-positive')
    })

    it('returns text-negative for negative amounts', () => {
      expect(useAmountColorClass(-1)).toBe('text-negative')
      expect(useAmountColorClass(-0.01)).toBe('text-negative')
    })

    it('returns text-grey-6 for zero', () => {
      expect(useAmountColorClass(0)).toBe('text-grey-6')
    })
  })
})
