import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { getAPIURL } from '../js/api'

export const useScenariosStore = defineStore('scenarios', () => {
  // State
  const scenarios = ref([])
  const currentScenario = ref(null)
  const profile = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const allScenarios = computed(() => scenarios.value || [])

  const defaultScenario = computed(() => {
    if (!scenarios.value || !scenarios.value.length) {
      return null
    }
    return scenarios.value.find(
      (scenario) => scenario.name && scenario.name.toLowerCase() === 'default',
    )
  })

  const selectedScenario = computed(() => currentScenario.value)

  const isDefaultScenario = computed(() => {
    return (
      currentScenario.value &&
      currentScenario.value.name &&
      currentScenario.value.name.toLowerCase() === 'default'
    )
  })

  const customScenarios = computed(() => {
    if (!scenarios.value || !scenarios.value.length) {
      return []
    }
    return scenarios.value.filter(
      (scenario) => scenario.name && scenario.name.toLowerCase() !== 'default',
    )
  })

  const hasScenarios = computed(() => scenarios.value && scenarios.value.length > 0)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)

  // Actions
  function setProfile(prof) {
    profile.value = prof
  }

  async function fetchScenarios() {
    if (!profile.value?.id) {
      console.error('No profile set for fetching scenarios')
      return
    }

    loading.value = true
    error.value = null

    try {
      const url = `${getAPIURL()}/api/scenario/get-all-scenarios-for-profile`
      const response = await axios.get(url, {
        params: { profileID: profile.value.id },
      })

      scenarios.value = response.data

      // Auto-select default scenario if available
      if (scenarios.value.length > 0) {
        const defScenario = defaultScenario.value
        if (defScenario) {
          await selectScenario(defScenario)
        } else {
          await selectScenario(scenarios.value[0])
        }
      }
    } catch (err) {
      console.error('Error fetching scenarios:', err)
      error.value = err.message || 'Failed to fetch scenarios'
    } finally {
      loading.value = false
    }
  }

  async function selectScenario(scenario) {
    if (!scenario) {
      console.error('selectScenario: scenario is null or undefined')
      return
    }

    currentScenario.value = scenario
  }

  async function selectScenarioById(scenarioId) {
    const scenario = scenarios.value.find((s) => s.id === scenarioId)
    if (scenario) {
      await selectScenario(scenario)
    } else {
      console.error('Scenario not found with ID:', scenarioId)
    }
  }

  async function selectDefaultScenario() {
    const defScenario = defaultScenario.value
    if (defScenario) {
      await selectScenario(defScenario)
    } else {
      console.warn('No default scenario found')
    }
  }

  async function createScenario(name, description, is_default = false) {
    if (!profile.value?.id) {
      throw new Error('No profile set for creating scenario')
    }

    loading.value = true
    error.value = null

    try {
      const url = `${getAPIURL()}/api/scenario/create-scenario`
      const response = await axios.post(url, {
        profileID: profile.value.id,
        name: name,
        description: description,
        is_default: is_default,
      })

      await fetchScenarios()
      return response.data
    } catch (err) {
      console.error('Error creating scenario:', err)
      error.value = err.message || 'Failed to create scenario'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteScenario(scenarioId) {
    if (!profile.value?.id) {
      throw new Error('No profile set for deleting scenario')
    }

    loading.value = true
    error.value = null

    try {
      const url = `${getAPIURL()}/api/scenario/remove-scenario`
      await axios.delete(url, {
        data: {
          profileID: profile.value.id,
          scenarioID: scenarioId,
        },
      })

      // If we deleted the current scenario, select the default
      if (currentScenario.value?.id === scenarioId) {
        await selectDefaultScenario()
      }

      await fetchScenarios()
    } catch (err) {
      console.error('Error deleting scenario:', err)
      error.value = err.message || 'Failed to delete scenario'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateScenario(scenarioId, updates) {
    if (!profile.value?.id) {
      throw new Error('No profile set for updating scenario')
    }

    loading.value = true
    error.value = null

    try {
      const url = `${getAPIURL()}/api/scenario/update-scenario`
      const response = await axios.put(url, {
        profileID: profile.value.id,
        scenarioID: scenarioId,
        ...updates,
      })

      await fetchScenarios()
      return response.data
    } catch (err) {
      console.error('Error updating scenario:', err)
      error.value = err.message || 'Failed to update scenario'
      throw err
    } finally {
      loading.value = false
    }
  }

  function reset() {
    scenarios.value = []
    currentScenario.value = null
    loading.value = false
    error.value = null
  }

  function resetForNewUser() {
    reset()
    profile.value = null
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    scenarios,
    currentScenario,
    profile,
    loading,
    error,
    // Getters
    allScenarios,
    defaultScenario,
    selectedScenario,
    isDefaultScenario,
    customScenarios,
    hasScenarios,
    isLoading,
    hasError,
    // Actions
    setProfile,
    fetchScenarios,
    selectScenario,
    selectScenarioById,
    selectDefaultScenario,
    createScenario,
    deleteScenario,
    updateScenario,
    reset,
    resetForNewUser,
    clearError,
  }
})
