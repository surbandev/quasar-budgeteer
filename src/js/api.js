/**
 * API base URL.
 * - Web dev/prod: empty string → same-origin `/api/...` (Quasar dev proxy or Netlify redirect)
 * - Capacitor builds: set API_URL at build time to your full backend URL
 */
export function getAPIURL() {
  return process.env.API_URL || ''
}
