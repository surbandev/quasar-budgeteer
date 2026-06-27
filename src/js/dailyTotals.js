import { getEventDisplayAmount } from './scenarioSummary'

// Parse an event date without UTC drift: YYYY-MM-DD strings are treated as local
// dates (matches the rest of the app's date handling).
function parseEventDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(value)
}

function atMidnight(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// Aggregate a flat list of planned events into per-day income / expenses /
// spending arrays spanning [start, end] inclusive. This is the single source of
// truth used by both the Overview component and the preload store so cached and
// freshly-fetched charts always match.
export function aggregateDailyTotals(events, start, end) {
  const s = atMidnight(start)
  const e = atMidnight(end)

  const dayMs = 1000 * 60 * 60 * 24
  const daysDiff = Math.max(0, Math.ceil((e.getTime() - s.getTime()) / dayMs) + 1)

  const dailySpending = new Array(daysDiff).fill(0)
  const dailyIncome = new Array(daysDiff).fill(0)
  const dailyExpenses = new Array(daysDiff).fill(0)

  if (!Array.isArray(events)) {
    return { dailySpending, dailyIncome, dailyExpenses }
  }

  events.forEach((event) => {
    if (!event || !event.date) return

    const eventDate = atMidnight(parseEventDate(event.date))
    if (eventDate < s || eventDate > e) return

    const dayIndex = Math.floor((eventDate.getTime() - s.getTime()) / dayMs)
    if (dayIndex < 0 || dayIndex >= daysDiff) return

    const amount = getEventDisplayAmount(event)
    if (Number.isNaN(amount) || !Number.isFinite(amount)) return

    if (event.type === 'CREDIT') {
      dailyIncome[dayIndex] += amount
      dailySpending[dayIndex] += amount
    } else if (event.type === 'DEBIT' && event.category !== 'SAVINGS') {
      dailyExpenses[dayIndex] += amount
      dailySpending[dayIndex] += amount
    }
  })

  return { dailySpending, dailyIncome, dailyExpenses }
}
