const logDal = require('../dal/log')

const CATEGORY = {
  ERROR: 'ERROR',
  EMAIL: 'EMAIL',
  ACCOUNT_REQUEST: 'ACCOUNT_REQUEST',
}

function normalizeDetail(detail) {
  if (detail == null) return null
  if (typeof detail === 'string') return detail
  try {
    return JSON.stringify(detail)
  } catch {
    return String(detail)
  }
}

// All log writes are best-effort: a logging failure must never break the
// request that triggered it (e.g. if the DB/table is unavailable).
async function record({ category, level = 'info', message, detail }) {
  try {
    await logDal.addLog({ category, level, message, detail: normalizeDetail(detail) })
  } catch (e) {
    console.error('[logger] Failed to persist log entry:', e)
  }
}

function logError(message, detail) {
  console.error(`[error] ${message}`, detail || '')
  return record({ category: CATEGORY.ERROR, level: 'error', message, detail })
}

function logEmail(message, detail) {
  return record({ category: CATEGORY.EMAIL, level: 'info', message, detail })
}

function logAccountRequest(message, detail) {
  return record({ category: CATEGORY.ACCOUNT_REQUEST, level: 'info', message, detail })
}

module.exports = {
  CATEGORY,
  record,
  logError,
  logEmail,
  logAccountRequest,
}
