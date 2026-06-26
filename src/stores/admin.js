import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { getAPIURL } from '../js/api'

function authConfig() {
  const token = localStorage.getItem('token')
  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {}
}

export const useAdminStore = defineStore('admin', () => {
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchUsers() {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get(`${getAPIURL()}/api/user/admin/users`, authConfig())
      users.value = response.data?.users || []
      return users.value
    } catch (err) {
      console.error('Error fetching users:', err)
      error.value = err.message || 'Failed to fetch users'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createUser(userData) {
    loading.value = true
    error.value = null
    try {
      const response = await axios.post(
        `${getAPIURL()}/api/user/admin/users`,
        userData,
        authConfig(),
      )
      await fetchUsers()
      return response.data
    } catch (err) {
      console.error('Error creating user:', err)
      error.value = err.message || 'Failed to create user'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateUser(userData) {
    loading.value = true
    error.value = null
    try {
      const response = await axios.put(
        `${getAPIURL()}/api/user/admin/users`,
        userData,
        authConfig(),
      )
      await fetchUsers()
      return response.data
    } catch (err) {
      console.error('Error updating user:', err)
      error.value = err.message || 'Failed to update user'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteUser(userID) {
    loading.value = true
    error.value = null
    try {
      await axios.delete(`${getAPIURL()}/api/user/admin/users`, {
        ...authConfig(),
        data: { userID },
      })
      await fetchUsers()
    } catch (err) {
      console.error('Error deleting user:', err)
      error.value = err.message || 'Failed to delete user'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  }
})
