import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { useProfileStore } from 'src/stores/profile.js'

vi.mock('axios')
vi.mock('src/js/api.js', () => ({ getAPIURL: () => 'https://test.example' }))

const storage = {}
const localStorageMock = {
  getItem: (key) => storage[key] ?? null,
  setItem: (key, value) => {
    storage[key] = String(value)
  },
  removeItem: (key) => {
    delete storage[key]
  },
  clear: () => {
    Object.keys(storage).forEach((k) => delete storage[k])
  },
  get length() {
    return Object.keys(storage).length
  },
  key: (i) => Object.keys(storage)[i] ?? null,
}
beforeAll(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })
})

describe('profile store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('has correct initial state', () => {
    const store = useProfileStore()
    expect(store.profiles).toEqual([])
    expect(store.currentProfile).toBe(null)
    expect(store.isEditing).toBe(false)
  })

  it('getCurrentProfile returns currentProfile', () => {
    const store = useProfileStore()
    expect(store.getCurrentProfile()).toBe(null)
    store.currentProfile = { id: 1, name: 'Test' }
    expect(store.getCurrentProfile()).toEqual({ id: 1, name: 'Test' })
  })

  it('getIsEditing returns isEditing', () => {
    const store = useProfileStore()
    expect(store.getIsEditing()).toBe(false)
    store.isEditing = true
    expect(store.getIsEditing()).toBe(true)
  })

  it('getAllProfiles returns profiles array', () => {
    const store = useProfileStore()
    expect(store.getAllProfiles()).toEqual([])
    store.profiles = [{ id: 1 }]
    expect(store.getAllProfiles()).toEqual([{ id: 1 }])
  })

  it('setCurrentProfile sets currentProfile', () => {
    const store = useProfileStore()
    const profile = { id: 1, name: 'My Profile' }
    store.setCurrentProfile(profile)
    expect(store.currentProfile).toEqual(profile)
  })

  it('resetCurrentProfile clears state', () => {
    const store = useProfileStore()
    store.profiles = [{ id: 1 }]
    store.currentProfile = { id: 1 }
    store.isEditing = true
    store.resetCurrentProfile()
    expect(store.profiles).toEqual([])
    expect(store.currentProfile).toBe(null)
    expect(store.isEditing).toBe(false)
  })

  it('fetchProfiles sets profiles on success', async () => {
    axios.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'P1' }] })
    const store = useProfileStore()
    await store.fetchProfiles()
    expect(store.profiles).toEqual([{ id: 1, name: 'P1' }])
  })

  it('fetchProfiles throws on error', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'))
    const store = useProfileStore()
    await expect(store.fetchProfiles()).rejects.toThrow()
  })
})
