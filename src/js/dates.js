import { DateTime } from 'luxon'

/**
 * Fix date string to ensure proper formatting
 * @param {string|Date} dateValue - The date value to fix
 * @returns {string} - Properly formatted date string
 */
export function fixDate(dateValue) {
  if (!dateValue) return dateValue

  try {
    // If it's already a Date object
    if (dateValue instanceof Date) {
      return dateValue.toISOString()
    }

    // If it's a string, parse it with Luxon
    if (typeof dateValue === 'string') {
      // Try parsing as ISO format
      const dt = DateTime.fromISO(dateValue)
      if (dt.isValid) {
        return dt.toISO()
      }

      // Try parsing as SQL format
      const dtSQL = DateTime.fromSQL(dateValue)
      if (dtSQL.isValid) {
        return dtSQL.toISO()
      }

      // Return original if parsing fails
      return dateValue
    }

    return dateValue
  } catch (error) {
    console.error('Error fixing date:', error, dateValue)
    return dateValue
  }
}

/**
 * Format a date for display
 * @param {string|Date} dateValue - The date value to format
 * @param {string} format - Luxon format string (default: 'MMM dd, yyyy')
 * @returns {string} - Formatted date string
 */
export function formatDate(dateValue, format = 'MMM dd, yyyy') {
  if (!dateValue) return ''

  try {
    let dt
    if (dateValue instanceof Date) {
      dt = DateTime.fromJSDate(dateValue)
    } else if (typeof dateValue === 'string') {
      dt = DateTime.fromISO(dateValue)
      if (!dt.isValid) {
        dt = DateTime.fromSQL(dateValue)
      }
    }

    if (dt && dt.isValid) {
      return dt.toFormat(format)
    }

    return dateValue.toString()
  } catch (error) {
    console.error('Error formatting date:', error, dateValue)
    return dateValue.toString()
  }
}

/**
 * Get the first day of the month
 * @param {Date} date - The date to get first day from
 * @returns {Date} - First day of the month
 */
export function getFirstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * Get the last day of the month
 * @param {Date} date - The date to get last day from
 * @returns {Date} - Last day of the month
 */
export function getLastDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

/**
 * Add months to a date
 * @param {Date} date - The starting date
 * @param {number} months - Number of months to add (can be negative)
 * @returns {Date} - New date with months added
 */
export function addMonths(date, months) {
  const dt = DateTime.fromJSDate(date).plus({ months })
  return dt.toJSDate()
}

/**
 * Check if two dates are the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} - True if same day
 */
export function isSameDay(date1, date2) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  )
}
