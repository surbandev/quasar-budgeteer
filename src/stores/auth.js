import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { getAPIURL } from '../js/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const userID = ref(localStorage.getItem('userID') || null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const currentUser = computed(() => user.value)
  const getToken = computed(() => token.value)
  const getUserID = computed(() => userID.value)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)

  // Actions
  async function login(username, password) {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post(`${getAPIURL()}/api/user/login`, {
        username: username.trim(),
        password: password,
      })

      token.value = response.data.token
      userID.value = response.data.userID
      localStorage.setItem('token', token.value)
      localStorage.setItem('userID', userID.value)

      return response.data
    } catch (err) {
      console.error('Login failed:', err)
      error.value = err.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(userData) {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post(`${getAPIURL()}/api/user/register`, userData)
      return response.data
    } catch (err) {
      console.error('Registration failed:', err)
      error.value = err.message || 'Registration failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    token.value = null
    userID.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userID')
  }

  async function fetchUser(userID) {
    loading.value = true
    error.value = null

    try {
      const token = localStorage.getItem('token')
      const config = token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : {}

      const response = await axios.get(
        `${getAPIURL()}/api/user/get-user?userID=${userID}`,
        config
      )

      if (response.data?.user) {
        user.value = response.data.user
      }

      return response.data
    } catch (err) {
      console.error('Error fetching user:', err)
      error.value = err.message || 'Failed to fetch user'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateUser(userID, userData) {
    loading.value = true
    error.value = null

    try {
      const token = localStorage.getItem('token')
      const config = token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : {}

      const updateData = {
        userID: userID,
        ...userData,
      }

      const response = await axios.put(`${getAPIURL()}/api/user/update-user`, updateData, config)

      if (response.data?.user) {
        user.value = response.data.user
      }

      return response.data
    } catch (err) {
      console.error('Error updating user:', err)
      error.value = err.message || 'Failed to update user'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    user,
    token,
    userID,
    loading,
    error,
    // Getters
    isAuthenticated,
    currentUser,
    getToken,
    getUserID,
    isLoading,
    hasError,
    // Actions
    login,
    register,
    logout,
    fetchUser,
    updateUser,
    clearError,
  }
})
