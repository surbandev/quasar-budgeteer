/**
 * Repair tenant databases whose default collation / stored routines drifted to
 * utf8mb4_0900_ai_ci while their table columns are utf8mb4_general_ci.
 *
 * The mismatch makes stored procedures fail with:
 *   ER_CANT_AGGREGATE_2COLLATIONS - Illegal mix of collations ... for operation '='
 *
 * Because a routine's collation is fixed at creation time, the fix is:
 *   1. ALTER DATABASE ... COLLATE utf8mb4_general_ci
 *   2. DROP + recreate every stored procedure/function under that collation
 *
 * Usage:
 *   node backend/scripts/fix-collation.js                 # dry run (no changes)
 *   node backend/scripts/fix-collation.js --apply         # apply against backend/.env DB
 *   node backend/scripts/fix-collation.js --apply --env .env.railway
 */
const path = require('path')

const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const envIdx = args.indexOf('--env')
const envFile = envIdx !== -1 ? args[envIdx + 1] : '.env'

require('dotenv').config({ path: path.join(__dirname, '..', envFile) })
const mysql = require('mysql2/promise')

const TARGET_COLLATION = 'utf8mb4_general_ci'
const TARGET_CHARSET = 'utf8mb4'

function stripDefiner(createSql) {
  return createSql.replace(/DEFINER\s*=\s*`[^`]+`@`[^`]+`\s+/i, '')
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD,
    multipleStatements: false,
    ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
  })

  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}  Host: ${process.env.DB_HOST}  Env: ${envFile}\n`)

  const [dbs] = await conn.query('SHOW DATABASES')
  const skip = new Set([
    'information_schema',
    'mysql',
    'performance_schema',
    'sys',
    process.env.DB_DATABASE,
  ])

  let fixedCount = 0

  for (const row of dbs) {
    const db = Object.values(row)[0]
    if (skip.has(db)) continue

    // Only touch real tenant databases (those holding scenario data).
    const [hasTable] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.tables
       WHERE table_schema = ? AND table_name = 'scenario_events'`,
      [db],
    )
    if (!hasTable[0].c) continue

    const [schema] = await conn.query(
      `SELECT DEFAULT_COLLATION_NAME AS coll FROM information_schema.schemata WHERE schema_name = ?`,
      [db],
    )
    const dbCollation = schema[0]?.coll
    if (!dbCollation) continue

    if (dbCollation === TARGET_COLLATION) {
      continue
    }

    console.log(`DB ${db}: default collation ${dbCollation} -> ${TARGET_COLLATION}`)

    const [routines] = await conn.query(
      `SELECT ROUTINE_NAME AS name, ROUTINE_TYPE AS type FROM information_schema.routines
       WHERE routine_schema = ?`,
      [db],
    )

    // Capture every routine definition before making changes.
    const defs = []
    for (const r of routines) {
      const [[createRow]] = await conn.query(
        `SHOW CREATE ${r.type} \`${db}\`.\`${r.name}\``,
      )
      const key = r.type === 'PROCEDURE' ? 'Create Procedure' : 'Create Function'
      const createSql = createRow[key]
      if (!createSql) {
        throw new Error(`Could not read definition for ${r.type} ${db}.${r.name}`)
      }
      defs.push({ name: r.name, type: r.type, sql: stripDefiner(createSql) })
    }

    console.log(`  ${defs.length} routines to recreate`)

    if (!APPLY) {
      console.log('  (dry run - no changes made)\n')
      continue
    }

    await conn.query(`ALTER DATABASE \`${db}\` CHARACTER SET ${TARGET_CHARSET} COLLATE ${TARGET_COLLATION}`)
    await conn.query(`USE \`${db}\``)
    await conn.query(`SET collation_connection = '${TARGET_COLLATION}'`)
    await conn.query(`SET collation_database = '${TARGET_COLLATION}'`)

    for (const def of defs) {
      await conn.query(`DROP ${def.type} IF EXISTS \`${def.name}\``)
      await conn.query(def.sql)
    }

    console.log('  done\n')
    fixedCount++
  }

  await conn.end()
  console.log(APPLY ? `Applied fixes to ${fixedCount} database(s).` : 'Dry run complete.')
}

main().catch((err) => {
  console.error('fix-collation failed:', err.message)
  process.exit(1)
})
