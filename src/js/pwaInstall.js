const DISMISS_KEY = 'budgeteer-pwa-install-dismissed'

export function isStandalonePwa() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true
  )
}

export function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function isAndroid() {
  return /Android/i.test(navigator.userAgent)
}

export function isMobileBrowser() {
  return isIos() || isAndroid()
}

export function wasInstallBannerDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissInstallBanner() {
  try {
    localStorage.setItem(DISMISS_KEY, '1')
  } catch {
    // ignore storage errors
  }
}
