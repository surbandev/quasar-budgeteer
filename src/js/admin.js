export const ADMIN_USERNAMES = ['surban', 'shawn urban']

export function isAdminUsername(username) {
  if (!username) return false
  return ADMIN_USERNAMES.includes(String(username).trim().toLowerCase())
}

export function isAdminUser(user) {
  if (!user) return false
  if (isAdminUsername(user.username)) return true

  const first = user.firstname || user.first_name || ''
  const last = user.lastname || user.last_name || ''
  const fullName = `${first} ${last}`.trim().toLowerCase()
  return fullName === 'shawn urban'
}

export function getUsernameFromToken(token) {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(atob(normalized))
    return decoded.username || null
  } catch {
    return null
  }
}
