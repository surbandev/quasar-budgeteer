const express = require('express')
const logLogic = require('../logic/log')
const { authenticateToken } = require('../middlware/session')
const { requireAdmin } = require('../middlware/admin')

const app = express.Router()

app.get('/all', authenticateToken, requireAdmin, async (req, res) => {
  logLogic.listLogs(req, res)
})

module.exports = app
