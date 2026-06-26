const { v4: uuidv4 } = require('uuid')
const db = require('./db')
const common = require('../logic/common')

function isGrantNotAllowedError(error) {
  return (
    error?.code === 'ER_CANT_CREATE_USER_WITH_GRANT' ||
    String(error?.sqlMessage || error?.message || '').includes('GRANT')
  )
}

async function databaseMetadataExists(newDBID) {
  const row = await db.dbQueryOneSession(
    'SELECT id FROM `databases` WHERE id = ? LIMIT 1',
    [newDBID],
  )
  return Boolean(row)
}

async function insertDatabaseMetadata(newDBID, dbUsername, dbPassword, userID) {
  const columns = await db.dbQuery('SHOW COLUMNS FROM `databases`', [])
  const fields = columns.map((column) => column.Field)
  const values = {}
  const assign = (name, value) => {
    if (fields.includes(name)) {
      values[name] = value
    }
  }

  assign('id', newDBID)
  assign('db_id', newDBID)
  assign('database_id', newDBID)
  assign('username', dbUsername)
  assign('password', dbPassword)
  assign('user_id', userID)
  assign('userid', userID)
  assign('owner_id', userID)
  assign('owner', userID)

  const keys = Object.keys(values)
  if (!keys.length) {
    throw new Error('Could not map databases table columns for user provisioning')
  }

  const columnList = keys.map((key) => '`' + key + '`').join(', ')
  const placeholders = keys.map(() => '?').join(', ')
  await db.dbExecuteSession(
    `INSERT INTO \`databases\` (${columnList}) VALUES (${placeholders})`,
    keys.map((key) => values[key]),
  )
}

async function registerDatabaseMetadata(newDBID, dbUsername, dbPassword, userID) {
  try {
    await db.dbExecuteSession('CALL sp_databases_add_database(?,?,?,?)', [
      newDBID,
      dbUsername,
      dbPassword,
      userID,
    ])
  } catch (error) {
    const spPartialSuccess =
      isGrantNotAllowedError(error) || error?.code === 'ER_DUP_ENTRY'
    if (!spPartialSuccess) {
      throw error
    }

    // SP may insert the row then fail on CREATE USER ... GRANT (Railway / managed MySQL)
    if (!(await databaseMetadataExists(newDBID))) {
      await insertDatabaseMetadata(newDBID, dbUsername, dbPassword, userID)
    }
  }

  try {
    await db.dbExecuteSession('CALL sp_users_set_database(?,?)', [userID, newDBID])
  } catch (error) {
    await db.dbExecuteSession('UPDATE users SET `db` = ? WHERE id = ?', [newDBID, userID])
  }
}

async function rollbackAccount(newDBID) {
  if (!newDBID) {
    return
  }

  try {
    await db.dbExecuteSession('DELETE FROM `databases` WHERE id = ?', [newDBID])
  } catch (error) {
    console.warn('rollbackAccount: could not delete databases row', error.message)
  }

  try {
    await db.dbQuerySession('DROP DATABASE IF EXISTS `' + newDBID + '`', [])
  } catch (error) {
    console.warn('rollbackAccount: could not drop database', error.message)
  }
}

async function addAccount(userID, firstName, lastName, phone, email) {
  const newDBID = uuidv4()
  const newDBUsername = common.randomString(20)
  const newDBPassword = common.randomString(50)

  try {
    await db.dbQuerySession(
      'CREATE DATABASE `' +
        newDBID +
        '` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci',
      [],
    )
    await registerDatabaseMetadata(newDBID, newDBUsername, newDBPassword, userID)

    const dbSetupScripts = await db.dbQuery(
      'SELECT cmd FROM database_setup_scripts ORDER BY id ASC',
      [],
    )
    for (const script of dbSetupScripts) {
      await db.dbQuery(script.cmd, [], userID)
    }

    await db.dbExecuteOne(
      'CALL sp_profiles_add_default_profile(?,?,?,?,?)',
      [userID, firstName, lastName, phone, email],
      userID,
    )

    return newDBID
  } catch (error) {
    await rollbackAccount(newDBID)
    throw error
  }
}

module.exports = {
  addAccount,
  rollbackAccount,
}
