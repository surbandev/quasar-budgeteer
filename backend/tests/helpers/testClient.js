const request = require('supertest')
const { createApp } = require('../../server')
const db = require('../../dal/db')

let appInstance

async function getApp() {
  await db.initDB()
  if (!appInstance) {
    appInstance = createApp({ serveStatic: false })
  }
  return appInstance
}

function client(app) {
  return request(app)
}

function unique(prefix) {
  const stamp = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${stamp}_${rand}`
}

/**
 * Remove every trace of a test user created during a run:
 *  - drop the provisioned tenant database (this clears all profiles, scenarios,
 *    events and settings that the tests pushed into it)
 *  - delete the tenant metadata row
 *  - delete feedback rows written to the master DB
 *  - delete the master users row
 */
async function cleanupUserByUsername(username) {
  if (!username) return

  const user = await db.dbQueryOneSession(
    'SELECT id, `db` AS dbId FROM users WHERE username = ?',
    [username],
  )
  if (!user) return

  const dbId = user.dbId
  if (dbId) {
    try {
      await db.dbQuerySession('DROP DATABASE IF EXISTS `' + dbId + '`', [])
    } catch {
      /* ignore */
    }
    try {
      await db.dbExecuteSession('DELETE FROM `databases` WHERE id = ?', [dbId])
    } catch {
      /* ignore */
    }
  }

  // Feedback lands in the master DB; column name has varied across schema
  // versions, so try the known variants defensively.
  for (const column of ['user_id', 'userid', 'userId']) {
    try {
      await db.dbExecuteSession(`DELETE FROM feedback WHERE ${column} = ?`, [user.id])
    } catch {
      /* ignore */
    }
  }

  try {
    await db.dbExecuteSession('DELETE FROM users WHERE id = ?', [user.id])
  } catch {
    /* ignore */
  }
}

module.exports = {
  getApp,
  client,
  unique,
  cleanupUserByUsername,
}
