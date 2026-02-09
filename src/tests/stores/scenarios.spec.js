import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScenariosStore } from 'src/stores/scenarios.js'

vi.mock('axios')
vi.mock('src/js/api.js', () => ({ getAPIURL: () => 'https://test.example' }))

describe('scenarios store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('has correct initial state', () => {
    const store = useScenariosStore()
    expect(store.scenarios).toEqual([])
    expect(store.currentScenario).toBe(null)
    expect(store.profile).toBe(null)
    expect(store.loading).toBe(false)
    expect(store.error).toBe(null)
  })

  it('allScenarios returns scenarios array', () => {
    const store = useScenariosStore()
    expect(store.allScenarios).toEqual([])
    store.scenarios = [{ id: 1, name: 'Default' }]
    expect(store.allScenarios).toEqual([{ id: 1, name: 'Default' }])
  })

  it('defaultScenario finds scenario with name default (case-insensitive)', () => {
    const store = useScenariosStore()
    store.scenarios = [
      { id: 1, name: 'Custom' },
      { id: 2, name: 'default' },
      { id: 3, name: 'DEFAULT' },
    ]
    expect(store.defaultScenario).toEqual({ id: 2, name: 'default' })
  })

  it('defaultScenario returns null when empty', () => {
    const store = useScenariosStore()
    expect(store.defaultScenario).toBe(null)
  })

  it('customScenarios excludes default', () => {
    const store = useScenariosStore()
    store.scenarios = [
      { id: 1, name: 'default' },
      { id: 2, name: 'Vacation' },
    ]
    expect(store.customScenarios).toEqual([{ id: 2, name: 'Vacation' }])
  })

  it('hasScenarios is true when scenarios exist', () => {
    const store = useScenariosStore()
    expect(store.hasScenarios).toBe(false)
    store.scenarios = [{ id: 1 }]
    expect(store.hasScenarios).toBe(true)
  })

  it('selectedScenario returns currentScenario', () => {
    const store = useScenariosStore()
    const scenario = { id: 1, name: 'Test' }
    store.currentScenario = scenario
    expect(store.selectedScenario).toEqual(scenario)
  })

  it('isDefaultScenario is true when current has name default', () => {
    const store = useScenariosStore()
    store.currentScenario = { id: 1, name: 'default' }
    expect(store.isDefaultScenario).toBe(true)
    store.currentScenario = { id: 2, name: 'Other' }
    expect(store.isDefaultScenario).toBe(false)
  })

  it('setProfile sets profile', () => {
    const store = useScenariosStore()
    const profile = { id: 1, name: 'P1' }
    store.setProfile(profile)
    expect(store.profile).toEqual(profile)
  })

  it('selectScenario sets currentScenario', async () => {
    const store = useScenariosStore()
    const scenario = { id: 1, name: 'S1' }
    await store.selectScenario(scenario)
    expect(store.currentScenario).toEqual(scenario)
  })

  it('selectScenarioById finds and selects scenario', async () => {
    const store = useScenariosStore()
    store.scenarios = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]
    await store.selectScenarioById('b')
    expect(store.currentScenario).toEqual({ id: 'b', name: 'B' })
  })

  it('reset clears state', () => {
    const store = useScenariosStore()
    store.scenarios = [{ id: 1 }]
    store.currentScenario = { id: 1 }
    store.loading = true
    store.error = 'err'
    store.reset()
    expect(store.scenarios).toEqual([])
    expect(store.currentScenario).toBe(null)
    expect(store.loading).toBe(false)
    expect(store.error).toBe(null)
  })

  it('resetForNewUser clears profile and scenarios', () => {
    const store = useScenariosStore()
    store.profile = { id: 1 }
    store.scenarios = [{ id: 1 }]
    store.resetForNewUser()
    expect(store.profile).toBe(null)
    expect(store.scenarios).toEqual([])
  })

  it('clearError sets error to null', () => {
    const store = useScenariosStore()
    store.error = 'Something failed'
    store.clearError()
    expect(store.error).toBe(null)
  })
})
