const { v4: uuidv4 } = require('uuid')
const db = require('./db')

async function addLog({ category, level, message, detail }) {
  const id = uuidv4()
  await db.dbExecute(
    'INSERT INTO app_logs (id, category, level, message, detail) VALUES (?,?,?,?,?)',
    [
      id,
      String(category || 'GENERAL').slice(0, 32),
      String(level || 'info').slice(0, 16),
      message != null ? String(message) : null,
      detail != null ? String(detail) : null,
    ],
  )
  return id
}

async function listLogs({ category, limit } = {}) {
  const cappedLimit = Math.min(Math.max(Number(limit) || 200, 1), 1000)
  if (category) {
    const rows = await db.dbQuery(
      'SELECT * FROM app_logs WHERE category = ? ORDER BY created_at DESC LIMIT ?',
      [category, cappedLimit],
    )
    return rows || []
  }
  const rows = await db.dbQuery(
    'SELECT * FROM app_logs ORDER BY created_at DESC LIMIT ?',
    [cappedLimit],
  )
  return rows || []
}

module.exports = {
  addLog,
  listLogs,
}
