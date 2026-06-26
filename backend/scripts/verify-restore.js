require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.railway-restore') })

const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

async function main() {
  const manifest = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '..', '..', 'backups', '2026-06-26T16-45-41-097Z', 'manifest.json'),
      'utf8',
    ),
  )

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 3306,
  })

  let ok = true
  for (const [databaseName, expected] of Object.entries(manifest.databases)) {
    await connection.query(`USE \`${databaseName}\``)
    for (const [table, count] of Object.entries(expected.rowCounts)) {
      const [[row]] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``)
      const actual = Number(row.count)
      const match = actual === count
      if (!match) ok = false
      console.log(`${match ? 'OK' : 'MISMATCH'} ${databaseName}.${table}: ${actual} (expected ${count})`)
    }
  }

  await connection.end()
  process.exit(ok ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
