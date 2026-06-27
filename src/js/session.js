import { useAuthStore } from 'stores/auth'
import { useOverviewStore } from 'stores/overview'

// Holds the live router instance so non-component code (axios interceptors,
// boot files) can navigate in a way that works in BOTH history and hash
// (Capacitor/mobile) router modes — unlike window.location.replace('/login'),
// which breaks under hash mode.
let routerRef = null

export function registerRouter(router) {
  routerRef = router
}

function decodeTokenPayload(token) {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(normalized))
  } catch {
    return null
  }
}

// Returns true only when we can PROVE the token is expired from its `exp` claim.
// If there's no exp or it can't be decoded, we don't assume expiry here — the
// server stays the source of truth via 401 responses.
export function isTokenExpired(token) {
  const payload = decodeTokenPayload(token)
  if (!payload || typeof payload.exp !== 'number') return false
  return Date.now() >= payload.exp * 1000
}

function goToLogin() {
  if (routerRef) {
    if (routerRef.currentRoute.value.path !== '/login') {
      routerRef.replace('/login').catch(() => {})
    }
    return
  }

  // Router not ready yet (very early in boot). Redirect in a mode-agnostic way.
  if (typeof window !== 'undefined') {
    if (window.location.href.includes('#')) {
      window.location.hash = '#/login'
    } else {
      window.location.assign('/login')
    }
  }
}

// Single place that tears down a dead/stale session and routes to /login.
// Safe to call from interceptors, the router guard, or components.
export function endSessionAndRedirect() {
  try {
    useAuthStore().logout()
  } catch {
    // Pinia not active yet — clear persisted auth directly as a fallback.
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('userID')
    } catch {
      /* ignore */
    }
  }

  try {
    useOverviewStore().clear()
  } catch {
    /* ignore — overview cache is best-effort */
  }

  goToLogin()
}
