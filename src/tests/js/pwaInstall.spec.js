import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  dismissInstallBanner,
  isAndroid,
  isIos,
  isMobileBrowser,
  isStandalonePwa,
  wasInstallBannerDismissed,
} from 'src/js/pwaInstall.js'

describe('pwaInstall', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
    Object.defineProperty(window.navigator, 'standalone', {
      configurable: true,
      value: false,
    })
  })

  it('isStandalonePwa detects standalone display mode', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query) => ({ matches: query === '(display-mode: standalone)' })),
    )
    expect(isStandalonePwa()).toBe(true)
  })

  it('isIos and isAndroid detect mobile user agents', () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      standalone: false,
    })
    expect(isIos()).toBe(true)
    expect(isMobileBrowser()).toBe(true)

    vi.stubGlobal('navigator', {
      ...navigator,
      userAgent: 'Mozilla/5.0 (Linux; Android 14)',
      standalone: false,
    })
    expect(isAndroid()).toBe(true)
  })

  it('tracks install banner dismissal in localStorage', () => {
    expect(wasInstallBannerDismissed()).toBe(false)
    dismissInstallBanner()
    expect(wasInstallBannerDismissed()).toBe(true)
  })
})
