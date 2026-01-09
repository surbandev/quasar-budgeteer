import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { getAPIURL } from '../js/api'

export const useProfileStore = defineStore('profile', () => {
  // State
  const profiles = ref([])
  const currentProfile = ref(null)
  const isEditing = ref(false)

  // Getters
  const getCurrentProfile = () => currentProfile.value
  const getIsEditing = () => isEditing.value
  const getAllProfiles = () => profiles.value

  // Actions
  async function fetchProfiles() {
    try {
      const token = localStorage.getItem('token')

      const config = token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : {}

      const response = await axios.get(`${getAPIURL()}/api/profile/get-all-profiles`, config)
      profiles.value = response.data
    } catch (error) {
      console.error('Error fetching profiles:', error)
      throw error
    }
  }

  async function addProfile(profileData) {
    try {
      await axios.post(`${getAPIURL()}/api/profile/add-new-profile`, profileData)
      await fetchProfiles()
    } catch (error) {
      console.error('Error adding profile:', error)
      throw error
    }
  }

  async function updateProfile(profileData) {
    try {
      await axios.put(`${getAPIURL()}/api/profile/update-profile`, profileData)
      await fetchProfiles()
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  async function deleteProfile(profileID) {
    try {
      await axios.delete(`${getAPIURL()}/api/profile/remove-profile?profileID=${profileID}`)
      await fetchProfiles()
    } catch (error) {
      console.error('Error deleting profile:', error)
      throw error
    }
  }

  function setCurrentProfile(profile) {
    currentProfile.value = profile
  }

  function resetCurrentProfile() {
    profiles.value = []
    currentProfile.value = null
    isEditing.value = false
  }

  return {
    // State
    profiles,
    currentProfile,
    isEditing,
    // Getters
    getCurrentProfile,
    getIsEditing,
    getAllProfiles,
    // Actions
    fetchProfiles,
    addProfile,
    updateProfile,
    deleteProfile,
    setCurrentProfile,
    resetCurrentProfile,
  }
})
