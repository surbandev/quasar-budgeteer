const path = require('path')

const envFile = process.env.BUDGETEER_ENV_FILE
  ? path.resolve(__dirname, process.env.BUDGETEER_ENV_FILE)
  : path.join(__dirname, '.env')

require('dotenv').config({ path: envFile })

if (process.env.BUDGETEER_ENV_FILE) {
  console.log(`Using env file: ${envFile}`)
}
const express = require('express')
const cors = require('cors')
const { initDB, checkAdminAccount, ensureAppSchema } = require('./dal/db')
const { tweakRquest } = require('./middlware/global')

const userRoutes = require('./routes/user')
const profilesRoutes = require('./routes/profile')
const scenarioRoutes = require('./routes/scenario')
const settingRoutes = require('./routes/setting')
const feedbackRoutes = require('./routes/feedback')
const logRoutes = require('./routes/log')

const prod = process.env.PRODUCTION === 'true'
const port = Number(process.env.PORT) || 3000

function resolveDistDir() {
  const fs = require('fs')
  const distRoot = path.join(__dirname, '..', 'dist')
  for (const sub of ['pwa', 'spa']) {
    const candidate = path.join(distRoot, sub)
    if (fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate
    }
  }
  return path.join(distRoot, 'spa')
}

const distDir = resolveDistDir()
const indexHtml = path.join(distDir, 'index.html')

function createApp({ serveStatic = prod } = {}) {
  const app = express()
  app.use(cors())
  app.use(express.json())

  if (serveStatic) {
    app.use(express.static(distDir))
    console.log('Serving UI from', distDir)
  } else {
    console.log('API-only mode (UI served separately by Quasar dev server)')
  }

  const apiDir = '/api/'

  app.get('/api/health', (req, res) => {
    res.json({ ok: true })
  })

  app.use(tweakRquest)
  app.use(apiDir + 'user', userRoutes)
  app.use(apiDir + 'profile', profilesRoutes)
  app.use(apiDir + 'scenario', scenarioRoutes)
  app.use(apiDir + 'setting', settingRoutes)
  app.use(apiDir + 'feedback', feedbackRoutes)
  app.use(apiDir + 'log', logRoutes)

  if (serveStatic) {
    app.get('*', (req, res) => {
      if (req.path.startsWith(apiDir)) {
        return res.status(404).json({ error: 'API route not found' })
      }
      res.sendFile(indexHtml)
    })
  }

  return app
}

async function start() {
  await initDB()
  const adminAccountValid = await checkAdminAccount()
  if (!adminAccountValid) {
    console.error('Failed to verify admin account. Exiting')
    process.exit(1)
  }
  await ensureAppSchema()

  const app = createApp()
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

if (require.main === module) {
  start()
}

module.exports = { createApp, start }
