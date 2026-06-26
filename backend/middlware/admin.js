const ADMIN_USERNAMES = new Set(['surban', 'shawn urban'])

function isAdminUsername(username) {
  if (!username) return false
  return ADMIN_USERNAMES.has(String(username).trim().toLowerCase())
}

function isAdminUserRecord(user) {
  if (!user) return false
  if (isAdminUsername(user.username)) return true

  const first = user.firstname || user.first_name || ''
  const last = user.lastname || user.last_name || ''
  const fullName = `${first} ${last}`.trim().toLowerCase()
  return fullName === 'shawn urban'
}

function requireAdmin(req, res, next) {
  if (!isAdminUsername(req.user?.username)) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

module.exports = {
  ADMIN_USERNAMES,
  isAdminUsername,
  isAdminUserRecord,
  requireAdmin,
}
