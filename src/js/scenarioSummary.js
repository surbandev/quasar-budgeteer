// Pure helpers for summarizing a scenario's planned events over a date range.
// Kept framework-free so they can be unit tested in isolation and reused by
// both the events store and the scenario-compare UI.

const LOAN_CATEGORIES = ['MORTGAGE', 'GENERIC_LOAN', 'AUTO_LOAN']

// Mirrors the events store: loans plan on their monthly payment (plus mortgage
// escrow), everything else plans on its raw amount.
export function getEventDisplayAmount(event) {
  if (!event) return 0

  const monthlyPayment = event.monthly_payment ?? event.monthlyPayment
  if (LOAN_CATEGORIES.includes(event.category) && monthlyPayment && monthlyPayment > 0) {
    const payment = parseFloat(monthlyPayment) || 0
    if (event.category === 'MORTGAGE' && event.escrow && event.escrow > 0) {
      const escrow = parseFloat(event.escrow) || 0
      return payment + escrow
    }
    return payment
  }

  const parsed = parseFloat(event.amount)
  return Number.isNaN(parsed) || !Number.isFinite(parsed) ? 0 : parsed
}

// Collapses a flat list of planned events into the same income / expenses /
// savings / net buckets the Overview snapshot uses, so compare numbers always
// line up with what the user already sees.
export function summarizeEvents(events) {
  const summary = { income: 0, expenses: 0, savings: 0, net: 0 }

  if (!Array.isArray(events)) return summary

  for (const event of events) {
    if (!event) continue
    const amount = getEventDisplayAmount(event)
    if (Number.isNaN(amount) || !Number.isFinite(amount)) continue

    if (event.type === 'CREDIT') {
      summary.income += amount
    } else if (event.category === 'SAVINGS') {
      summary.savings += amount
    } else if (event.type === 'DEBIT') {
      summary.expenses += amount
    }
  }

  summary.net = summary.income - summary.expenses
  return summary
}

// Per-bucket deltas of a candidate scenario relative to the base plan.
export function diffSummary(candidate, base) {
  const a = candidate || { income: 0, expenses: 0, savings: 0, net: 0 }
  const b = base || { income: 0, expenses: 0, savings: 0, net: 0 }
  return {
    income: a.income - b.income,
    expenses: a.expenses - b.expenses,
    savings: a.savings - b.savings,
    net: a.net - b.net,
  }
}
