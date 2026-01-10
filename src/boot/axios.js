import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { fixDate } from '../js/dates'

// Create axios instance
const api = axios.create()

export default boot(({ app }) => {
  // Request interceptor - add auth token
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  // Response interceptor - fix dates
  api.interceptors.response.use(
    (response) => {
      if (!response.data) {
        return response
      }

      function modifyDates(obj) {
        if (Array.isArray(obj)) {
          obj.forEach((item) => modifyDates(item))
        } else if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              if (
                key.toLowerCase().includes('date') &&
                obj[key] !== null &&
                obj[key] !== undefined
              ) {
                obj[key] = fixDate(obj[key])
              }
              if (typeof obj[key] === 'object') {
                modifyDates(obj[key])
              }
            }
          }
        }
      }

      modifyDates(response.data)
      return response
    },
    (error) => {
      console.error('Response error intercepted:', error.message)
      return Promise.reject(error)
    },
  )

  // Set axios to global and axios instance to app
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api

  // Also set default axios interceptors
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  axios.interceptors.response.use(
    (response) => {
      if (!response.data) {
        return response
      }

      function modifyDates(obj) {
        if (Array.isArray(obj)) {
          obj.forEach((item) => modifyDates(item))
        } else if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              if (
                key.toLowerCase().includes('date') &&
                obj[key] !== null &&
                obj[key] !== undefined
              ) {
                obj[key] = fixDate(obj[key])
              }
              if (typeof obj[key] === 'object') {
                modifyDates(obj[key])
              }
            }
          }
        }
      }

      modifyDates(response.data)
      return response
    },
    (error) => {
      console.error('Response error intercepted:', error.message)
      return Promise.reject(error)
    },
  )
})

export { api }
