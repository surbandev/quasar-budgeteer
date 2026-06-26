/**
 * CLI helper to create a Budgeteer user (same flow as Admin Settings).
 *
 * Usage:
 *   node backend/scripts/add-user.js <username> <password> <firstname> <lastname> <email> [phone]
 *
 * Env: uses backend/.env or BUDGETEER_ENV_FILE (e.g. .env.railway)
 */
require('dotenv').config({
  path: (() => {
    const path = require('path')
    const envName = process.env.BUDGETEER_ENV_FILE || '.env'
    return path.join(__dirname, '..', envName)
  })(),
})

const { initDB } = require('../dal/db')
const { createFullUser } = require('../logic/provisionUser')

async function main() {
  const [username, password, firstname, lastname, email, phone = ''] = process.argv.slice(2)

  if (!username || !password || !firstname || !lastname || !email) {
    console.error(
      'Usage: node backend/scripts/add-user.js <username> <password> <firstname> <lastname> <email> [phone]',
    )
    process.exit(1)
  }

  await initDB()
  const result = await createFullUser({
    username,
    password,
    firstname,
    lastname,
    phone,
    email,
  })

  if (result.error) {
    console.error('Failed:', result.error)
    process.exit(1)
  }

  console.log('User created:', {
    id: result.user?.id,
    username: result.user?.username,
    email: result.user?.email,
  })
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
