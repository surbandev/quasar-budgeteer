import { describe, it, expect } from 'vitest'
import { getEventDisplayAmount, summarizeEvents, diffSummary } from 'src/js/scenarioSummary.js'

describe('scenarioSummary.js', () => {
  describe('getEventDisplayAmount', () => {
    it('uses the raw amount for non-loan events', () => {
      expect(getEventDisplayAmount({ category: 'GROCERIES', amount: '125.50' })).toBe(125.5)
    })

    it('uses the monthly payment for loan events', () => {
      expect(
        getEventDisplayAmount({ category: 'AUTO_LOAN', amount: '20000', monthly_payment: '450' }),
      ).toBe(450)
    })

    it('adds escrow to the mortgage payment', () => {
      expect(
        getEventDisplayAmount({
          category: 'MORTGAGE',
          amount: '300000',
          monthly_payment: '1800',
          escrow: '400',
        }),
      ).toBe(2200)
    })

    it('falls back to amount when a loan has no monthly payment', () => {
      expect(getEventDisplayAmount({ category: 'GENERIC_LOAN', amount: '99' })).toBe(99)
    })

    it('returns 0 for missing or invalid amounts', () => {
      expect(getEventDisplayAmount(null)).toBe(0)
      expect(getEventDisplayAmount({ amount: 'not-a-number' })).toBe(0)
    })
  })

  describe('summarizeEvents', () => {
    it('buckets income, expenses, and savings and computes net', () => {
      const events = [
        { type: 'CREDIT', category: 'PRIMARY_INCOME', amount: '5000' },
        { type: 'DEBIT', category: 'GROCERIES', amount: '600' },
        { type: 'DEBIT', category: 'RENT', amount: '1500' },
        { type: 'DEBIT', category: 'SAVINGS', amount: '400' },
      ]
      const result = summarizeEvents(events)
      expect(result.income).toBe(5000)
      expect(result.expenses).toBe(2100)
      expect(result.savings).toBe(400)
      // net is income minus expenses (savings is reported separately)
      expect(result.net).toBe(2900)
    })

    it('treats savings as its own bucket, not an expense', () => {
      const result = summarizeEvents([{ type: 'DEBIT', category: 'SAVINGS', amount: '250' }])
      expect(result.expenses).toBe(0)
      expect(result.savings).toBe(250)
    })

    it('honors loan monthly payments', () => {
      const result = summarizeEvents([
        { type: 'DEBIT', category: 'AUTO_LOAN', amount: '20000', monthly_payment: '450' },
      ])
      expect(result.expenses).toBe(450)
    })

    it('returns an empty summary for non-arrays', () => {
      expect(summarizeEvents(null)).toEqual({ income: 0, expenses: 0, savings: 0, net: 0 })
    })
  })

  describe('diffSummary', () => {
    it('computes per-bucket deltas relative to the base plan', () => {
      const base = { income: 5000, expenses: 2000, savings: 300, net: 3000 }
      const candidate = { income: 5500, expenses: 2400, savings: 300, net: 3100 }
      expect(diffSummary(candidate, base)).toEqual({
        income: 500,
        expenses: 400,
        savings: 0,
        net: 100,
      })
    })

    it('handles missing summaries gracefully', () => {
      expect(diffSummary(null, null)).toEqual({ income: 0, expenses: 0, savings: 0, net: 0 })
    })
  })
})
