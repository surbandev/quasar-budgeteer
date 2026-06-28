const logDal = require('../dal/log')

// Admin only: returns recent application logs, newest first. Supports an
// optional ?category=ERROR|EMAIL|ACCOUNT_REQUEST filter and ?limit=.
async function listLogs(req, res) {
  try {
    const category = req.query.category ? String(req.query.category).toUpperCase() : null
    const limit = req.query.limit
    const logs = await logDal.listLogs({ category, limit })
    res.json({ logs })
  } catch (error) {
    console.error('Error listing logs:', error)
    res.status(500).json({ error: 'Failed to load logs' })
  }
}

module.exports = {
  listLogs,
}
