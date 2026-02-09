import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConstantsStore } from 'src/stores/constants.js'

describe('constants store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('exposes category options', () => {
    const store = useConstantsStore()
    expect(store.getCategoryOptions).toBeDefined()
    expect(store.getCategoryOptions.length).toBeGreaterThan(0)
    expect(store.getCategoryOptions[0]).toHaveProperty('label')
    expect(store.getCategoryOptions[0]).toHaveProperty('value')
  })

  it('isLoanCategory identifies loan categories', () => {
    const store = useConstantsStore()
    expect(store.isLoanCategory('MORTGAGE')).toBe(true)
    expect(store.isLoanCategory('AUTO_LOAN')).toBe(true)
    expect(store.isLoanCategory('GENERIC_LOAN')).toBe(true)
    expect(store.isLoanCategory('GROCERY')).toBe(false)
  })

  it('getCategoryColor returns color for known category', () => {
    const store = useConstantsStore()
    expect(store.getCategoryColor('MORTGAGE')).toBe('#9c27b0')
    expect(store.getCategoryColor('GROCERY')).toBe('#4caf50')
  })

  it('getCategoryColor returns fallback for unknown category', () => {
    const store = useConstantsStore()
    expect(store.getCategoryColor('UNKNOWN')).toBe('#9e9e9e')
  })

  it('getCategoryColor is case-insensitive', () => {
    const store = useConstantsStore()
    expect(store.getCategoryColor('mortgage')).toBe('#9c27b0')
  })

  it('getBrandIcon returns path for known brand', () => {
    const store = useConstantsStore()
    expect(store.getBrandIcon('Spotify')).toBe('Spotify.png')
    expect(store.getBrandIcon('hulu')).toBe('Hulu.jpeg')
  })

  it('getBrandIcon returns null for unknown brand', () => {
    const store = useConstantsStore()
    expect(store.getBrandIcon('UnknownBrand')).toBe(null)
  })

  it('hasBrandIcon is true when brand or category icon exists', () => {
    const store = useConstantsStore()
    expect(store.hasBrandIcon('Spotify', 'ENTERTAINMENT')).toBe(true)
    expect(store.hasBrandIcon('Random', 'PRIMARY_INCOME')).toBe(true)
  })
})
