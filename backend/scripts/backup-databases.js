/**
 * Full backup of all Budgeteer MariaDB databases (master + per-user DBs).
 * Usage: node backend/scripts/backup-databases.js
 * Output: backups/<timestamp>/full-backup.sql + manifest.json
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

const SYSTEM_DATABASES = new Set([
  'information_schema',
  'performance_schema',
  'mysql',
  'sys',
])

function escapeIdentifier(name) {
  return '`' + String(name).replace(/`/g, '``') + '`'
}

function escapeValue(value) {
  if (value === null || value === undefined) return 'NULL'
  if (value instanceof Date) {
    return "'" + value.toISOString().slice(0, 19).replace('T', ' ') + "'"
  }
  if (Buffer.isBuffer(value)) {
    return "X'" + value.toString('hex') + "'"
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? '1' : '0'
  return (
    "'" +
    String(value)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\0/g, '\\0') +
    "'"
  )
}

function getBaseConnectionConfig() {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 3306,
    connectTimeout: 60000,
    multipleStatements: true,
  }

  if (process.env.DB_SSL !== 'false') {
    const caPath = path.join(__dirname, '..', 'dal', 'ca.crt')
    config.ssl = {
      rejectUnauthorized: false,
      ca: fs.existsSync(caPath) ? fs.readFileSync(caPath, 'utf8') : undefined,
    }
  }

  return config
}

async function listDatabases(connection) {
  const [rows] = await connection.query('SHOW DATABASES')
  return rows.map((row) => row.Database).filter((name) => !SYSTEM_DATABASES.has(name))
}

async function dumpDatabase(connection, databaseName, write) {
  write(`\n-- Database: ${databaseName}\n`)
  write(
    `CREATE DATABASE IF NOT EXISTS ${escapeIdentifier(databaseName)} ` +
      `CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;\n`,
  )
  write(
    `ALTER DATABASE ${escapeIdentifier(databaseName)} ` +
      `CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;\n`,
  )
  write(`USE ${escapeIdentifier(databaseName)};\n`)

  const [tables] = await connection.query(`SHOW FULL TABLES FROM ${escapeIdentifier(databaseName)}`)
  const tableRows = []

  for (const row of tables) {
    const tableName = row[`Tables_in_${databaseName}`]
    const tableType = row.Table_type
    tableRows.push({ name: tableName, type: tableType })
  }

  for (const { name: tableName, type: tableType } of tableRows) {
    if (tableType === 'VIEW') continue

    const [[createRow]] = await connection.query(
      `SHOW CREATE TABLE ${escapeIdentifier(databaseName)}.${escapeIdentifier(tableName)}`,
    )
    const createSql = createRow['Create Table'].replace(/\buuid\b(?!\s*\()/gi, 'char(36)')
    write(`\nDROP TABLE IF EXISTS ${escapeIdentifier(tableName)};\n`)
    write(createSql + ';\n')

    const [rows] = await connection.query(
      `SELECT * FROM ${escapeIdentifier(databaseName)}.${escapeIdentifier(tableName)}`,
    )

    if (!rows.length) continue

    const columns = Object.keys(rows[0]).map(escapeIdentifier).join(', ')
    write(`\nLOCK TABLES ${escapeIdentifier(tableName)} WRITE;\n`)

    const batchSize = 100
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize)
      const values = batch
        .map((row) => {
          const vals = Object.values(row).map(escapeValue).join(', ')
          return `(${vals})`
        })
        .join(',\n')
      write(`INSERT INTO ${escapeIdentifier(tableName)} (${columns}) VALUES\n${values};\n`)
    }

    write(`UNLOCK TABLES;\n`)
  }

  const [routines] = await connection.query(
    `SELECT ROUTINE_NAME, ROUTINE_TYPE
     FROM information_schema.ROUTINES
     WHERE ROUTINE_SCHEMA = ?`,
    [databaseName],
  )

  for (const routine of routines) {
    const type = routine.ROUTINE_TYPE
    const name = routine.ROUTINE_NAME
    const [[defRow]] = await connection.query(
      `SHOW CREATE ${type} ${escapeIdentifier(databaseName)}.${escapeIdentifier(name)}`,
    )
    const key = type === 'PROCEDURE' ? 'Create Procedure' : 'Create Function'
    write(`\nDROP ${type} IF EXISTS ${escapeIdentifier(name)};\n`)
    write(`DELIMITER ;;\n${defRow[key]};;\nDELIMITER ;\n`)
  }

  return {
    tables: tableRows.filter((t) => t.type === 'BASE TABLE').map((t) => t.name),
    routines: routines.map((r) => r.ROUTINE_NAME),
    rowCounts: await getRowCounts(connection, databaseName, tableRows),
  }
}

async function getRowCounts(connection, databaseName, tableRows) {
  const counts = {}
  for (const { name, type } of tableRows) {
    if (type !== 'BASE TABLE') continue
    const [[row]] = await connection.query(
      `SELECT COUNT(*) AS count FROM ${escapeIdentifier(databaseName)}.${escapeIdentifier(name)}`,
    )
    counts[name] = Number(row.count)
  }
  return counts
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(__dirname, '..', '..', 'backups', timestamp)
  fs.mkdirSync(backupDir, { recursive: true })

  const sqlPath = path.join(backupDir, 'full-backup.sql')
  const stream = fs.createWriteStream(sqlPath, { encoding: 'utf8' })

  const write = (text) => stream.write(text)

  write('-- Budgeteer full database backup\n')
  write(`-- Created: ${new Date().toISOString()}\n`)
  write(`-- Source: ${process.env.DB_HOST}:${process.env.DB_PORT}\n`)
  write('SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n')

  const connection = await mysql.createConnection(getBaseConnectionConfig())
  const databases = await listDatabases(connection)
  const manifest = { createdAt: new Date().toISOString(), sourceHost: process.env.DB_HOST, databases: {} }

  console.log(`Backing up ${databases.length} databases...`)

  for (const databaseName of databases) {
    console.log(`  - ${databaseName}`)
    manifest.databases[databaseName] = await dumpDatabase(connection, databaseName, write)
  }

  write('\nSET FOREIGN_KEY_CHECKS=1;\n')
  await connection.end()
  await new Promise((resolve, reject) => {
    stream.end(resolve)
    stream.on('error', reject)
  })

  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

  const sizeMb = (fs.statSync(sqlPath).size / (1024 * 1024)).toFixed(2)
  console.log(`\nBackup complete: ${backupDir}`)
  console.log(`SQL size: ${sizeMb} MB`)
  console.log(`Databases: ${databases.join(', ')}`)
}

main().catch((error) => {
  console.error('Backup failed:', error)
  process.exit(1)
})
