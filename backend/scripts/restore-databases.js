/**
 * Restore a full-backup.sql file produced by backup-databases.js
 * Usage: node backend/scripts/restore-databases.js <path-to-full-backup.sql>
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

function getBaseConnectionConfig() {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 3306,
    connectTimeout: 120000,
    multipleStatements: false,
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

function prepareSqlForMysql(sql) {
  return sql
    // MariaDB uuid column type only — do not touch UUID() function calls
    .replace(/\buuid\b(?!\s*\()/gi, 'char(36)')
    // MySQL on Railway won't have per-tenant MariaDB users as DEFINER
    .replace(/DEFINER\s*=\s*`[^`]+`@`[^`]+`\s+/gi, '')
    // MySQL requires session variables for PREPARE text inside procedures
    .replace(
      /\bPREPARE\s+(\w+)\s+FROM\s+(v_\w+)\s*;/gi,
      'SET @$2 = $2;\n  PREPARE $1 FROM @$2;',
    )
    .replace(/^DELIMITER ;;\s*$/gm, '')
    .replace(/^DELIMITER ;\s*$/gm, '')
    .replace(/;;\s*$/gm, ';')
}

function splitByDatabaseSections(sql) {
  const parts = sql.split(/\n-- Database: /)
  const preamble = parts.shift()
  const sections = []

  if (preamble && preamble.trim()) {
    sections.push({ name: 'preamble', sql: preamble })
  }

  for (const part of parts) {
    const newline = part.indexOf('\n')
    const name = part.slice(0, newline).trim()
    const body = part.slice(newline + 1)
    sections.push({ name, sql: body })
  }

  return sections
}

function extractRoutines(sql) {
  const routines = []
  const without = sql.replace(
    /(?:^|\n)DROP (?:PROCEDURE|FUNCTION) IF EXISTS `[^`]+`;\s*CREATE[\s\S]*?END;\s*(?=\n|$)/gim,
    (match) => {
      routines.push(match.trim())
      return '\n'
    },
  )
  return { sql: without, routines }
}

function splitSqlStatements(sql) {
  const statements = []
  let current = ''
  let inString = false
  let escape = false

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i]
    const next = sql[i + 1]

    if (inString) {
      current += char
      if (escape) {
        escape = false
        continue
      }
      if (char === '\\') {
        escape = true
        continue
      }
      if (char === "'" && next === "'") {
        current += next
        i++
        continue
      }
      if (char === "'") {
        inString = false
      }
      continue
    }

    if (char === "'") {
      inString = true
      current += char
      continue
    }

    if (char === ';') {
      const trimmed = current.trim()
      if (trimmed.length > 0 && !trimmed.startsWith('--')) {
        statements.push(trimmed)
      }
      current = ''
      continue
    }

    current += char
  }

  const trimmed = current.trim()
  if (trimmed.length > 0 && !trimmed.startsWith('--')) {
    statements.push(trimmed)
  }

  return statements
}

async function executeRoutine(connection, routineSql) {
  const dropMatch = routineSql.match(/^DROP (?:PROCEDURE|FUNCTION) IF EXISTS `[^`]+`;/i)
  if (!dropMatch) {
    await connection.query(routineSql)
    return
  }

  await connection.query(dropMatch[0])
  const createSql = routineSql.slice(dropMatch[0].length).trim()
  if (createSql) {
    await connection.query(createSql)
  }
}

async function executeSection(connection, sql) {
  const prepared = prepareSqlForMysql(sql)
  const { sql: tableSql, routines } = extractRoutines(prepared)

  for (const statement of splitSqlStatements(tableSql)) {
    await connection.query(statement)
  }

  for (const routine of routines) {
    await executeRoutine(connection, routine)
  }
}

async function main() {
  const sqlPath = process.argv[2]
  if (!sqlPath) {
    console.error('Usage: node backend/scripts/restore-databases.js <path-to-full-backup.sql>')
    process.exit(1)
  }

  const resolved = path.resolve(sqlPath)
  if (!fs.existsSync(resolved)) {
    console.error(`Backup file not found: ${resolved}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(resolved, 'utf8')
  const sections = splitByDatabaseSections(sql)
  const connection = await mysql.createConnection(getBaseConnectionConfig())

  console.log(`Restoring ${sections.length} sections to ${process.env.DB_HOST}...`)

  for (const section of sections) {
    const label = section.name === 'preamble' ? 'session setup' : section.name
    console.log(`  -> ${label}`)
    try {
      await executeSection(connection, section.sql)
    } catch (error) {
      console.error(`\nRestore failed in section: ${label}`)
      throw error
    }
  }

  await connection.end()
  console.log('Restore complete.')
}

main().catch((error) => {
  console.error('Restore failed:', error.message)
  process.exit(1)
})
