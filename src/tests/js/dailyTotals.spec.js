import { describe, it, expect } from 'vitest'
import { aggregateDailyTotals } from 'src/js/dailyTotals.js'

describe('dailyTotals.js', () => {
  const start = new Date(2026, 5, 1) // Jun 1, 2026 (local)
  const end = new Date(2026, 5, 30) // Jun 30, 2026 (local)

  it('buckets income and expenses by day index', () => {
    const events = [
      { date: '2026-06-01', type: 'CREDIT', category: 'PRIMARY_INCOME', amount: '1000' },
      { date: '2026-06-02', type: 'DEBIT', category: 'GROCERIES', amount: '200' },
    ]
    const { dailyIncome, dailyExpenses, dailySpending } = aggregateDailyTotals(events, start, end)

    expect(dailyIncome).toHaveLength(30)
    expect(dailyIncome[0]).toBe(1000)
    expect(dailyExpenses[1]).toBe(200)
    expect(dailySpending[0]).toBe(1000)
    expect(dailySpending[1]).toBe(200)
  })

  it('excludes SAVINGS from both income and expenses', () => {
    const events = [{ date: '2026-06-03', type: 'DEBIT', category: 'SAVINGS', amount: '300' }]
    const { dailyIncome, dailyExpenses, dailySpending } = aggregateDailyTotals(events, start, end)
    expect(dailyExpenses[2]).toBe(0)
    expect(dailyIncome[2]).toBe(0)
    expect(dailySpending[2]).toBe(0)
  })

  it('uses the monthly payment for loan events', () => {
    const events = [
      { date: '2026-06-04', type: 'DEBIT', category: 'AUTO_LOAN', amount: '20000', monthly_payment: '450' },
    ]
    const { dailyExpenses } = aggregateDailyTotals(events, start, end)
    expect(dailyExpenses[3]).toBe(450)
  })

  it('ignores events outside the range', () => {
    const events = [
      { date: '2026-05-31', type: 'CREDIT', category: 'PRIMARY_INCOME', amount: '999' },
      { date: '2026-07-01', type: 'DEBIT', category: 'GROCERIES', amount: '999' },
    ]
    const { dailyIncome, dailyExpenses } = aggregateDailyTotals(events, start, end)
    expect(dailyIncome.reduce((a, b) => a + b, 0)).toBe(0)
    expect(dailyExpenses.reduce((a, b) => a + b, 0)).toBe(0)
  })

  it('returns zero-filled arrays for empty or invalid input', () => {
    const { dailyIncome, dailyExpenses, dailySpending } = aggregateDailyTotals(null, start, end)
    expect(dailyIncome).toHaveLength(30)
    expect(dailyIncome.every((v) => v === 0)).toBe(true)
    expect(dailyExpenses.every((v) => v === 0)).toBe(true)
    expect(dailySpending.every((v) => v === 0)).toBe(true)
  })
})
