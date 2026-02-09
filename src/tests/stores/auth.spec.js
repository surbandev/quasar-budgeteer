import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { useAuthStore } from 'src/stores/auth.js'

vi.mock('axios')
vi.mock('src/js/api.js', () => ({ getAPIURL: () => 'https://test.example' }))

const storage = {}
const localStorageMock = {
  getItem: (key) => storage[key] ?? null,
  setItem: (key, value) => { storage[key] = String(value) },
  removeItem: (key) => { delete storage[key] },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]) },
  get length() { return Object.keys(storage).length },
  key: (i) => Object.keys(storage)[i] ?? null,
}
beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })
})
describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  it('has correct initial state when no token in localStorage', () => {
    const store = useAuthStore()
    expect(store.token).toBe(null)
    expect(store.userID).toBe(null)
    expect(store.user).toBe(null)
    expect(store.loading).toBe(false)
    expect(store.error).toBe(null)
  })

  it('isAuthenticated is false when no token', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
  })

  it('isAuthenticated is true when token in localStorage', () => {
    localStorage.setItem('token', 'fake-token')
    localStorage.setItem('userID', 'user-1')
    setActivePinia(createPinia())
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(true)
    expect(store.getToken).toBe('fake-token')
    expect(store.getUserID).toBe('user-1')
  })

  it('clearError sets error to null', () => {
    const store = useAuthStore()
    store.error = 'Some error'
    expect(store.hasError).toBe(true)
    store.clearError()
    expect(store.error).toBe(null)
    expect(store.hasError).toBe(false)
  })

  it('logout clears token, userID, user and localStorage', async () => {
    localStorage.setItem('token', 't')
    localStorage.setItem('userID', 'u')
    setActivePinia(createPinia())
    const store = useAuthStore()
    store.user = { id: 'u', name: 'Test' }
    await store.logout()
    expect(store.token).toBe(null)
    expect(store.userID).toBe(null)
    expect(store.user).toBe(null)
    expect(localStorage.getItem('token')).toBe(null)
    expect(localStorage.getItem('userID')).toBe(null)
  })

  it('login sets token and userID on success', async () => {
    axios.post.mockResolvedValueOnce({
      data: { token: 'new-token', userID: 'new-user-id' },
    })
    const store = useAuthStore()
    await store.login('user', 'pass')
    expect(store.token).toBe('new-token')
    expect(store.userID).toBe('new-user-id')
    expect(localStorage.getItem('token')).toBe('new-token')
    expect(localStorage.getItem('userID')).toBe('new-user-id')
    expect(store.error).toBe(null)
  })

  it('login sets error and throws on failure', async () => {
    axios.post.mockRejectedValueOnce(new Error('Invalid credentials'))
    const store = useAuthStore()
    await expect(store.login('user', 'wrong')).rejects.toThrow()
    expect(store.error).toBeTruthy()
    expect(store.loading).toBe(false)
  })
})
