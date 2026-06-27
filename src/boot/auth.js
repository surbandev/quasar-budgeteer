import { boot } from 'quasar/wrappers'
import { useAuthStore } from 'stores/auth'
import { getAPIURL } from '../js/api'
import { isTokenExpired } from '../js/session'

/**
 * Validate the stored token against the server before the app mounts.
 * Using native fetch (not axios) to avoid triggering the 401 interceptor's
 * window.location.replace, which would cause a full page reload during boot.
 * If the token is invalid or cannot be verified, it is cleared so the router
 * guard redirects to /login instead of rendering a protected page.
 */
export default boot(async () => {
  const authStore = useAuthStore()

  try {
    if (!authStore.isAuthenticated) return

    // Provably-expired token: drop it immediately, no need to ask the server.
    if (isTokenExpired(authStore.getToken)) {
      authStore.logout()
      return
    }

    try {
      const response = await fetch(
        `${getAPIURL()}/api/user/get-user?userID=${authStore.getUserID}`,
        { headers: { Authorization: `Bearer ${authStore.getToken}` } },
      )

      if (!response.ok) {
        authStore.logout()
      } else {
        const data = await response.json()
        if (data?.user) {
          authStore.user = data.user
        }
      }
    } catch {
      // Cannot verify the session — clear it so the user sees the login page
      authStore.logout()
    }
  } finally {
    authStore.setAuthChecked(true)
  }
})
