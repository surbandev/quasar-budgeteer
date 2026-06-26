import { defineStore } from 'pinia'
import axios from 'axios'
import { getAPIURL } from '../js/api'

export const DEFAULT_PROFILE_SETTING = 'DEFAULT_PROFILE_ID'

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

export const useSettingsStore = defineStore('settings', () => {
  async function setUserSetting(setting, value) {
    await axios.post(
      `${getAPIURL()}/api/setting/set-user-setting`,
      { setting, value },
      authConfig(),
    )
  }

  async function getUserSetting(setting) {
    const response = await axios.get(`${getAPIURL()}/api/setting/get-user-setting`, {
      params: { setting },
      ...authConfig(),
    })
    return response.data || ''
  }

  async function deleteUserSetting(setting) {
    await axios.delete(`${getAPIURL()}/api/setting/delete-user-setting`, {
      data: { setting },
      ...authConfig(),
    })
  }

  async function getDefaultProfileId() {
    return getUserSetting(DEFAULT_PROFILE_SETTING)
  }

  async function setDefaultProfileId(profileId) {
    await setUserSetting(DEFAULT_PROFILE_SETTING, profileId)
  }

  async function clearDefaultProfileId() {
    await deleteUserSetting(DEFAULT_PROFILE_SETTING)
  }

  return {
    setUserSetting,
    getUserSetting,
    deleteUserSetting,
    getDefaultProfileId,
    setDefaultProfileId,
    clearDefaultProfileId,
  }
})
