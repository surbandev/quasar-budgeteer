const assert = require('assert')
const mysql = require('mysql2/promise')
const bluebird = require('bluebird')
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcryptjs')

var dbPool = undefined
var userDBPools = new Map()

const LEGACY_COLLATION_STATEMENTS = [
  "SET NAMES utf8mb4 COLLATE utf8mb4_general_ci",
  "SET collation_connection = 'utf8mb4_general_ci'",
  "SET character_set_client = 'utf8mb4'",
  "SET character_set_results = 'utf8mb4'",
]

function buildConnectionConfig(databaseName) {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    connectTimeout: 30000,
    dateStrings: true,
    Promise: bluebird,
    // Match legacy schema / stored procs (utf8mb4_general_ci) on MySQL 8 connections
    charset: 'UTF8MB4_GENERAL_CI',
  }

  if (databaseName) {
    config.database = databaseName
  } else if (process.env.DB_DATABASE) {
    config.database = process.env.DB_DATABASE
  }

  if (process.env.DB_SSL !== 'false') {
    const caPath = path.join(__dirname, 'ca.crt')
    config.ssl = {
      rejectUnauthorized: false,
      ca: fs.existsSync(caPath) ? fs.readFileSync(caPath, 'utf8') : undefined,
    }
  }

  return config
}

function attachCollationHook(pool) {
  const corePool = pool.pool ?? pool
  if (typeof corePool.on === 'function') {
    corePool.on('connection', (connection) => {
      for (const sql of LEGACY_COLLATION_STATEMENTS) {
        connection.query(sql)
      }
    })
  }
}

function createPoolWithCollation(config) {
  const pool = mysql.createPool(config)
  attachCollationHook(pool)
  return pool
}

async function applySessionCollation(connection) {
  for (const sql of LEGACY_COLLATION_STATEMENTS) {
    await connection.query(sql)
  }
}

async function withMasterSession(callback) {
  assert.ok(dbPool, 'Db has not been initialized. Please call initDB() first.')
  const connection = await dbPool.getConnection()
  try {
    await applySessionCollation(connection)
    return await callback(connection)
  } finally {
    connection.release()
  }
}

async function dbQueryOneSession(sql, params) {
  return withMasterSession(async (connection) => {
    const [rows] = await connection.execute(sql, patchParams(params))
    return _.first(rows)
  })
}

async function dbExecuteOneSession(sql, params) {
  return withMasterSession(async (connection) => {
    const [resultSets] = await connection.execute(sql, patchParams(params))
    if (Array.isArray(resultSets) && Array.isArray(resultSets[0])) {
      return _.first(resultSets[0])
    }
    return _.first(resultSets)
  })
}

async function dbExecuteSession(sql, params) {
  return withMasterSession(async (connection) => {
    return connection.execute(sql, patchParams(params))
  })
}

async function dbQuerySession(sql, params) {
  return withMasterSession(async (connection) => {
    return connection.query(sql, patchParams(params))
  })
}

var conf = buildConnectionConfig()

async function initDB() {
  if (dbPool) {
    return
  }
  try {
    dbPool = createPoolWithCollation(conf)
    assert.ok(dbPool, 'dbPool creation failed')
    console.log('Connection established')
  } catch (e) {
    console.error(e)
  }
}

async function getPoolForDatabase(databaseName) {
  if (!userDBPools.has(databaseName)) {
    const pool = createPoolWithCollation(buildConnectionConfig(databaseName))
    userDBPools.set(databaseName, pool)
  }
  return userDBPools.get(databaseName)
}

async function getDB() {
  assert.ok(dbPool, 'Db has not been initialized. Please call initDB() first.')
  return dbPool.getConnection()
}

async function getUserDBID(userID) {
  const row = await dbQueryOne('SELECT `db` FROM users WHERE id = ?', [userID])
  return _.get(row, 'db', '')
}

async function dbQuery(sql, params, userID) {
  let pool = dbPool
  if (userID) {
    let databaseID = await getUserDBID(userID)
    pool = await getPoolForDatabase(databaseID)
  }
  params = patchParams(params)
  assert.ok(pool, 'Db has not been initialized. Please call initDB() first.')
  const results = await pool.query(sql, params)
  if (!results) {
    return undefined
  }
  return _.first(results)
}

async function dbQueryOne(sql, params, userID) {
  let pool = dbPool
  if (userID) {
    let databaseID = await getUserDBID(userID)
    pool = await getPoolForDatabase(databaseID)
  }
  assert.ok(pool, 'Db has not been initialized. Please call initDB() first.')
  const rows = await dbQuery(sql, params, userID)
  return _.first(rows)
}

async function dbExecute(sql, params, userID) {
  let pool = dbPool
  if (userID) {
    let databaseID = await getUserDBID(userID)
    pool = await getPoolForDatabase(databaseID)
  }

  params = patchParams(params)
  assert.ok(pool, 'Db has not been initialized. Please call initDB() first.')
  return _.first(await pool.execute(sql, params))
}

async function dbExecuteOne(sql, params, userID) {
  let pool = dbPool
  if (userID) {
    let databaseID = await getUserDBID(userID)
    pool = await getPoolForDatabase(databaseID)
  }
  let rows = await dbExecute(sql, params, userID)
  return _.first(_.first(rows))
}

function patchParams(params) {
  if (!params) {
    return []
  }
  params = _.map(params, (param) => {
    if (_.isUndefined(param)) {
      param = null
    }
    return param
  })
  return params
}

// Ensures master-DB tables this app creates at runtime exist. Safe to run on
// every boot (IF NOT EXISTS). The app_logs table backs the admin Logs viewer.
async function ensureAppSchema() {
  try {
    await dbExecute(
      `CREATE TABLE IF NOT EXISTS app_logs (
        id CHAR(36) NOT NULL PRIMARY KEY,
        category VARCHAR(32) NOT NULL,
        level VARCHAR(16) NOT NULL DEFAULT 'info',
        message TEXT,
        detail TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    )
    await dbExecute(
      'CREATE INDEX idx_app_logs_created_at ON app_logs (created_at)',
    ).catch(() => {
      /* index already exists */
    })
    return true
  } catch (e) {
    console.error('Failed to ensure app schema:', e)
    return false
  }
}

async function checkAdminAccount() {
  try {
    let adminRow = await dbQuery('SELECT * FROM users WHERE username = ?', ['admin'])
    if (!adminRow.length) {
      const hashedPassword = bcrypt.hashSync('admin', 10)
      await dbExecute('INSERT INTO users (id, username, password) VALUES (?, ?, ?)', [
        uuidv4(),
        'admin',
        hashedPassword,
      ])
    }
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

module.exports = {
  initDB,
  getDB,
  dbQuery,
  dbQueryOne,
  dbExecute,
  dbExecuteOne,
  dbQueryOneSession,
  dbExecuteOneSession,
  dbExecuteSession,
  dbQuerySession,
  checkAdminAccount,
  ensureAppSchema,
}
