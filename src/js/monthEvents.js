/**
 * Helpers for month-scoped event views (Spending, List).
 * Overview may load a multi-month range into filteredEvents; these utilities
 * slice by month without extra API calls when the range already covers it.
 */

function eventDateKey(event) {
  if (!event?.date) return null
  return String(event.date).split('T')[0]
}

export function filterEventsForMonth(events, month, year) {
  if (!Array.isArray(events) || events.length === 0) return []

  return events.filter((event) => {
    const key = eventDateKey(event)
    if (!key) return false
    const [y, m] = key.split('-').map(Number)
    return y === year && m - 1 === month
  })
}

export function getLoadedEventsDateBounds(events) {
  if (!Array.isArray(events) || events.length === 0) return null

  let min = null
  let max = null

  for (const event of events) {
    const key = eventDateKey(event)
    if (!key) continue
    if (!min || key < min) min = key
    if (!max || key > max) max = key
  }

  return min && max ? { min, max } : null
}

export function isMonthWithinLoadedBounds(month, year, events) {
  const bounds = getLoadedEventsDateBounds(events)
  if (!bounds) return false

  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return monthEnd >= bounds.min && monthStart <= bounds.max
}

export function hasLoadedEventsForMonth(month, year, events) {
  return isMonthWithinLoadedBounds(month, year, events)
}
