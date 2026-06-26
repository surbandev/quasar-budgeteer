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

function buildConnectionConfig(databaseName) {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    connectTimeout: 30000,
    dateStrings: true,
    Promise: bluebird,
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

var conf = buildConnectionConfig()

async function initDB() {
  if (dbPool) {
    return
  }
  try {
    dbPool = mysql.createPool(conf)
    assert.ok(dbPool, 'dbPool creation failed')
    console.log('Connection established')
  } catch (e) {
    console.error(e)
  }
}

async function getPoolForDatabase(databaseName) {
  if (!userDBPools.has(databaseName)) {
    const pool = mysql.createPool(buildConnectionConfig(databaseName))
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
  checkAdminAccount,
}
