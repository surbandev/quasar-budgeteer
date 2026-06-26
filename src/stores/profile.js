import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { getAPIURL } from '../js/api'
import { useSettingsStore } from './settings'

export const useProfileStore = defineStore('profile', () => {
  // State
  const profiles = ref([])
  const currentProfile = ref(null)
  const defaultProfileId = ref(null)
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
      const token = localStorage.getItem('token')

      const config = token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : {}

      await axios.post(`${getAPIURL()}/api/profile/add-new-profile`, profileData, config)
      await fetchProfiles()
    } catch (error) {
      console.error('Error adding profile:', error)
      throw error
    }
  }

  async function updateProfile(profileData) {
    try {
      const token = localStorage.getItem('token')

      const config = token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : {}

      await axios.put(`${getAPIURL()}/api/profile/update-profile`, profileData, config)
      await fetchProfiles()
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  async function deleteProfile(profileID) {
    try {
      await axios.delete(`${getAPIURL()}/api/profile/remove-profile?profileID=${profileID}`)
      if (defaultProfileId.value == profileID) {
        const settingsStore = useSettingsStore()
        await settingsStore.clearDefaultProfileId()
        defaultProfileId.value = null
      }
      await fetchProfiles()
    } catch (error) {
      console.error('Error deleting profile:', error)
      throw error
    }
  }

  function findProfileById(profileId) {
    if (!profileId) return null
    return profiles.value.find((p) => p.id == profileId || p._id == profileId) || null
  }

  async function loadDefaultProfileId() {
    try {
      const settingsStore = useSettingsStore()
      const value = await settingsStore.getDefaultProfileId()
      defaultProfileId.value = value || null
    } catch (error) {
      console.warn('Could not load default profile setting:', error)
      defaultProfileId.value = null
    }
    return defaultProfileId.value
  }

  async function setDefaultProfile(profile) {
    const profileId = profile.id || profile._id
    const settingsStore = useSettingsStore()
    await settingsStore.setDefaultProfileId(profileId)
    defaultProfileId.value = profileId
  }

  async function resolveInitialProfile(options = {}) {
    const { ignoreStoredProfile = false } = options

    await fetchProfiles()
    await loadDefaultProfileId()

    const userID = localStorage.getItem('userID')
    const storedProfileID = ignoreStoredProfile ? null : localStorage.getItem('profileID')

    const resolved =
      findProfileById(defaultProfileId.value) ||
      findProfileById(storedProfileID) ||
      findProfileById(userID) ||
      profiles.value[0] ||
      null

    if (resolved) {
      setCurrentProfile(resolved)
      localStorage.setItem('profileID', resolved.id || resolved._id)
    }

    return resolved
  }

  function setCurrentProfile(profile) {
    currentProfile.value = profile
  }

  function resetCurrentProfile() {
    profiles.value = []
    currentProfile.value = null
    defaultProfileId.value = null
    isEditing.value = false
  }

  return {
    // State
    profiles,
    currentProfile,
    defaultProfileId,
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
    findProfileById,
    loadDefaultProfileId,
    setDefaultProfile,
    resolveInitialProfile,
    setCurrentProfile,
    resetCurrentProfile,
  }
})
