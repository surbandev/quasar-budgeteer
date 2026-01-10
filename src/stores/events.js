import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useScenariosStore } from './scenarios'
import { getAPIURL } from '../js/api'

export const useEventsStore = defineStore('events', () => {
  // State
  const events = ref([])
  const eventsByMonth = ref([])
  const filteredEvents = ref([])
  const combinedActiveEvents = ref([])
  const loading = ref(false)
  const error = ref(null)
  const profile = ref(null)
  const currentDate = ref(new Date())

  // Getters
  const allEvents = computed(() => events.value || [])
  const monthlyEvents = computed(() => eventsByMonth.value || [])
  const getFilteredEvents = computed(() => filteredEvents.value || [])
  const activeEvents = computed(() => combinedActiveEvents.value || [])
  const getCurrentDate = computed(() => currentDate.value)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)

  const selectedScenario = computed(() => {
    const scenariosStore = useScenariosStore()
    return scenariosStore.selectedScenario
  })

  const scenarios = computed(() => {
    const scenariosStore = useScenariosStore()
    return scenariosStore.allScenarios
  })

  const cashFlowInTotal = computed(() => {
    let totalCredit = 0
    if (events.value && events.value.length > 0) {
      for (let event of events.value) {
        if (event.type === 'CREDIT') {
          totalCredit += parseFloat(event.amount)
        }
      }
    }
    return totalCredit
  })

  const cashFlowOutTotal = computed(() => {
    let totalDebit = 0
    if (events.value && events.value.length > 0) {
      for (let event of events.value) {
        if (event.type === 'DEBIT') {
          totalDebit += parseFloat(event.amount)
        }
      }
    }
    return totalDebit
  })

  // Actions
  function setProfile(prof) {
    if (prof && prof.id) {
      profile.value = prof
    } else {
      console.warn('Invalid profile provided to events store:', prof)
    }
  }

  function setCurrentDate(date) {
    if (date instanceof Date) {
      currentDate.value = date
    } else {
      console.warn('Invalid date provided to events store:', date)
      currentDate.value = new Date()
    }
  }

  async function fetchEvents() {
    if (!selectedScenario.value?.id || !profile.value?.id) {
      console.error('No scenario or profile set for fetching events')
      return
    }

    loading.value = true
    error.value = null

    try {
      const url = `${getAPIURL()}/api/scenario/get-events-for-scenario`
      const response = await axios.get(url, {
        params: {
          scenarioID: selectedScenario.value.id,
          profileID: profile.value.id,
        },
      })
      events.value = response.data
    } catch (err) {
      console.error('Error fetching events:', err)
      error.value = err.message || 'Failed to fetch events'
    } finally {
      loading.value = false
    }
  }

  async function fetchEventsForMonthByScenario() {
    if (!selectedScenario.value?.id || !profile.value?.id) {
      console.error('No scenario or profile set for fetching monthly events')
      return
    }

    loading.value = true
    error.value = null

    if (!currentDate.value) {
      setCurrentDate(new Date())
    }

    try {
      const month = Number(currentDate.value.getMonth())
      const year = Number(currentDate.value.getFullYear())

      const url = `${getAPIURL()}/api/scenario/get-events-for-scenario-for-month`
      const response = await axios.get(url, {
        params: {
          scenarioID: selectedScenario.value.id,
          profileID: profile.value.id,
          month: month,
          year: year,
        },
      })
      eventsByMonth.value = response.data

      convertMonthlyEventsToFiltered()
    } catch (err) {
      console.error('Error fetching events for month by scenario:', err)
      error.value = err.message || 'Failed to fetch monthly events'
    } finally {
      loading.value = false
    }
  }

  async function fetchEventsForDateRange(startDate, endDate) {
    if (!profile.value?.id) {
      console.error('No profile set for fetching events for date range')
      return
    }

    loading.value = true
    error.value = null

    try {
      const monthsToFetch = []
      const startYear = startDate.getUTCFullYear()
      const startMonth = startDate.getUTCMonth()
      const endYear = endDate.getUTCFullYear()
      const endMonth = endDate.getUTCMonth()

      let currentYear = startYear
      let currentMonth = startMonth

      while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        monthsToFetch.push({ year: currentYear, month: currentMonth })

        currentMonth++
        if (currentMonth > 11) {
          currentMonth = 0
          currentYear++
        }
      }

      const allEvents = []

      for (const { year, month } of monthsToFetch) {
        const response = await axios.get(
          `${getAPIURL()}/api/scenario/get-events-for-scenario-for-month`,
          {
            params: {
              scenarioID: selectedScenario.value?.id,
              profileID: profile.value.id,
              month: month,
              year: year,
            },
          },
        )

        allEvents.push(...response.data)
      }

      filterEventsByDateRange(startDate, endDate, allEvents)
    } catch (err) {
      console.error('Error fetching events for date range:', err)
      error.value = err.message || 'Failed to fetch events for date range'
    } finally {
      loading.value = false
    }
  }

  function convertMonthlyEventsToFiltered(startDate = null, endDate = null) {
    const newFilteredEvents = []

    if (eventsByMonth.value && eventsByMonth.value.length > 0) {
      eventsByMonth.value.forEach((eventData) => {
        if (eventData.occurrences) {
          eventData.occurrences.forEach((occurrence) => {
            let occurrenceDate
            if (typeof occurrence === 'string') {
              if (occurrence.includes('T')) {
                const datePart = occurrence.split('T')[0]
                const [year, month, day] = datePart.split('-').map(Number)
                occurrenceDate = new Date(Date.UTC(year, month - 1, day))
              } else {
                const [year, month, day] = occurrence.split('-').map(Number)
                occurrenceDate = new Date(Date.UTC(year, month - 1, day))
              }
            } else {
              occurrenceDate = new Date(occurrence)
            }

            if (startDate && endDate) {
              const occurrenceDateString = occurrenceDate.toISOString().split('T')[0]
              const startDateString = startDate.toISOString().split('T')[0]
              const endDateString = endDate.toISOString().split('T')[0]

              if (occurrenceDateString < startDateString || occurrenceDateString > endDateString) {
                return
              }
            }

            const eventToAdd = {
              ...eventData.event,
              date: occurrenceDate.toISOString().split('T')[0],
            }
            newFilteredEvents.push(eventToAdd)
          })
        }
      })
    }

    filteredEvents.value = newFilteredEvents
  }

  function filterEventsByDateRange(startDate, endDate, allEvents) {
    const newFilteredEvents = []
    const seenEvents = new Set()

    if (allEvents && allEvents.length > 0) {
      allEvents.forEach((eventData) => {
        if (eventData.occurrences) {
          eventData.occurrences.forEach((occurrence) => {
            let occurrenceDate
            if (typeof occurrence === 'string') {
              if (occurrence.includes('T')) {
                const datePart = occurrence.split('T')[0]
                const [year, month, day] = datePart.split('-').map(Number)
                occurrenceDate = new Date(Date.UTC(year, month - 1, day))
              } else {
                const [year, month, day] = occurrence.split('-').map(Number)
                occurrenceDate = new Date(Date.UTC(year, month - 1, day))
              }
            } else {
              occurrenceDate = new Date(occurrence)
            }

            const occurrenceDateString = occurrenceDate.toISOString().split('T')[0]
            const startDateString = startDate.toISOString().split('T')[0]
            const endDateString = endDate.toISOString().split('T')[0]

            if (occurrenceDateString >= startDateString && occurrenceDateString <= endDateString) {
              const eventKey = `${eventData.event.id || eventData.event._id}-${occurrenceDateString}`

              if (!seenEvents.has(eventKey)) {
                seenEvents.add(eventKey)
                const eventToAdd = {
                  ...eventData.event,
                  date: occurrenceDateString,
                }
                newFilteredEvents.push(eventToAdd)
              }
            }
          })
        }
      })
    }

    filteredEvents.value = newFilteredEvents
  }

  async function createEvent(eventData) {
    if (!profile.value?.id) {
      throw new Error('No profile set for creating event')
    }

    loading.value = true
    error.value = null

    try {
      const url = `${getAPIURL()}/api/scenario/create-event`
      // Build payload - ALWAYS include ALL 18 fields explicitly, use null for missing values
      // This ensures the backend always receives all expected fields
      const payload = {
        active: 'active' in eventData ? eventData.active : true,
        amount: eventData.amount,
        calculatedEndDate: 'calculatedEndDate' in eventData && eventData.calculatedEndDate ? eventData.calculatedEndDate : eventData.endDate,
        category: eventData.category,
        description: 'description' in eventData ? eventData.description : '',
        endDate: eventData.endDate,
        escrow: 'escrow' in eventData ? eventData.escrow : null,
        frequency: eventData.frequency,
        interest: 'interest' in eventData ? eventData.interest : null,
        loanTerm: 'loanTerm' in eventData ? eventData.loanTerm : null,
        monthlyAmount: 'monthlyAmount' in eventData ? eventData.monthlyAmount : '',
        monthlyPayment: 'monthlyPayment' in eventData ? eventData.monthlyPayment : null,
        name: eventData.name,
        principal: 'principal' in eventData ? eventData.principal : null,
        profileID: eventData.profileID || profile.value.id,
        scenarioID: eventData.scenarioID,
        startDate: eventData.startDate,
        type: eventData.type,
      }
      
      // Log to verify all fields including nulls are present
      console.log('Store createEvent - payload keys:', Object.keys(payload))
      console.log('Store createEvent - payload (with nulls):', JSON.stringify(payload, null, 2))
      const response = await axios.post(url, payload)

      await fetchEvents()
      await fetchEventsForMonthByScenario()

      return response.data
    } catch (err) {
      console.error('Error creating event:', err)
      error.value = err.message || 'Failed to create event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateEvent(eventId, updates) {
    if (!profile.value?.id) {
      throw new Error('No profile set for updating event')
    }

    loading.value = true
    error.value = null

    try {
      const url = `${getAPIURL()}/api/scenario/update-event`
      const response = await axios.put(url, {
        eventID: eventId,
        profileID: profile.value.id,
        ...updates,
      })

      await fetchEvents()
      await fetchEventsForMonthByScenario()

      return response.data
    } catch (err) {
      console.error('Error updating event:', err)
      error.value = err.message || 'Failed to update event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteEvent(eventId) {
    if (!profile.value?.id) {
      throw new Error('No profile set for deleting event')
    }

    if (!selectedScenario.value?.id) {
      throw new Error('No scenario set for deleting event')
    }

    loading.value = true
    error.value = null

    try {
      // Backend function signature: removeEvent(scenarioID, profileID, eventID, userID)
      const url = `${getAPIURL()}/api/scenario/remove-event`
      const payload = {
        scenarioID: selectedScenario.value.id,
        profileID: profile.value.id,
        eventID: eventId,
      }
      
      console.log('Delete event - URL:', url)
      console.log('Delete event - Payload:', payload)
      
      // Try DELETE with request body first (matching scenario delete pattern)
      try {
        await axios.delete(url, {
          data: payload,
        })
      } catch (deleteError) {
        console.log('DELETE failed, trying POST:', deleteError.response?.status)
        // If DELETE fails, try POST (some backends use POST for delete operations)
        if (deleteError.response?.status === 404 || deleteError.response?.status === 405) {
          await axios.post(url, payload)
        } else {
          // If it's not a 404/405, try query parameters
          console.log('Trying query parameters format')
          await axios.delete(`${url}?scenarioID=${selectedScenario.value.id}&profileID=${profile.value.id}&eventID=${eventId}`)
        }
      }

      await fetchEvents()
      await fetchEventsForMonthByScenario()
    } catch (err) {
      console.error('Error deleting event:', err)
      error.value = err.message || 'Failed to delete event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchEventById(eventID) {
    if (!profile.value?.id || !eventID) {
      console.error('No profile or event ID set for fetching event')
      return null
    }

    loading.value = true
    error.value = null

    try {
      // Use the existing endpoint to get all events for the scenario, then filter for the specific event
      const url = `${getAPIURL()}/api/scenario/get-events-for-scenario`
      const response = await axios.get(url, {
        params: {
          scenarioID: selectedScenario.value?.id,
          profileID: profile.value.id,
        },
      })

      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response data:', response.data)
        return null
      }

      // Find the specific event by ID
      const event = response.data.find((e) => e.id === eventID || e._id === eventID)

      if (event) {
        return event
      } else {
        console.error('Event not found with ID:', eventID)
        return null
      }
    } catch (err) {
      console.error('Error fetching event by ID:', err)
      error.value = err.message || 'Failed to fetch event by ID'
      return null
    } finally {
      loading.value = false
    }
  }

  function reset() {
    events.value = []
    eventsByMonth.value = []
    filteredEvents.value = []
    combinedActiveEvents.value = []
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

  function setFilteredEvents(evts) {
    filteredEvents.value = evts || []
  }

  async function getAllActiveScenarioEvents(activeScenarioIds, startDate, endDate) {
    const allEvents = []
    const seenEvents = new Set()

    if (!profile.value?.id) return allEvents

    const profileID = profile.value.id

    try {
      for (const scenarioId of activeScenarioIds) {
        const actualScenarioId =
          scenarioId === 'default' ? selectedScenario.value?.id : scenarioId
        if (!actualScenarioId) continue

        const monthsToFetch = []
        const startYear = startDate.getUTCFullYear()
        const startMonth = startDate.getUTCMonth()
        const endYear = endDate.getUTCFullYear()
        const endMonth = endDate.getUTCMonth()

        let currentYear = startYear
        let currentMonth = startMonth

        while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
          monthsToFetch.push({ year: currentYear, month: currentMonth })
          currentMonth++
          if (currentMonth > 11) {
            currentMonth = 0
            currentYear++
          }
        }

        for (const { year, month } of monthsToFetch) {
          const response = await axios.get(
            `${getAPIURL()}/api/scenario/get-events-for-scenario-for-month`,
            {
              params: {
                scenarioID: actualScenarioId,
                profileID,
                month: month,
                year: year,
              },
            },
          )

          if (response.data && response.data.length > 0) {
            response.data.forEach((eventData) => {
              if (eventData.occurrences && eventData.occurrences.length > 0) {
                eventData.occurrences.forEach((occurrence) => {
                  let occurrenceDate
                  if (typeof occurrence === 'string') {
                    if (occurrence.includes('T')) {
                      const datePart = occurrence.split('T')[0]
                      const [year, month, day] = datePart.split('-').map(Number)
                      occurrenceDate = new Date(Date.UTC(year, month - 1, day))
                    } else {
                      const [year, month, day] = occurrence.split('-').map(Number)
                      occurrenceDate = new Date(Date.UTC(year, month - 1, day))
                    }
                  } else {
                    occurrenceDate = new Date(occurrence)
                  }

                  const occurrenceDateString = occurrenceDate.toISOString().split('T')[0]
                  const startDateString = startDate.toISOString().split('T')[0]
                  const endDateString = endDate.toISOString().split('T')[0]

                  if (
                    occurrenceDateString >= startDateString &&
                    occurrenceDateString <= endDateString
                  ) {
                    const loanCategories = ['MORTGAGE', 'GENERIC_LOAN', 'AUTO_LOAN']
                    const monthlyPayment =
                      eventData.event.monthly_payment || eventData.event.monthlyPayment
                    let displayAmount
                    if (
                      loanCategories.includes(eventData.event.category) &&
                      monthlyPayment &&
                      monthlyPayment > 0
                    ) {
                      if (
                        eventData.event.category === 'MORTGAGE' &&
                        eventData.event.escrow &&
                        eventData.event.escrow > 0
                      ) {
                        displayAmount =
                          parseFloat(monthlyPayment) + parseFloat(eventData.event.escrow)
                      } else {
                        displayAmount = monthlyPayment
                      }
                    } else {
                      displayAmount = eventData.event.amount
                    }

                    const eventToAdd = {
                      ...eventData.event,
                      amount: displayAmount,
                      date: occurrenceDateString,
                    }

                    const uniqueKey = `${eventData.event.id || eventData.event._id}-${occurrenceDateString}-${eventData.event.name || eventData.event.description || ''}`

                    if (!seenEvents.has(uniqueKey)) {
                      seenEvents.add(uniqueKey)
                      allEvents.push(eventToAdd)
                    }
                  }
                })
              }
            })
          }
        }
      }
    } catch (error) {
      console.error('Error fetching events for active scenarios:', error)
    }

    return allEvents
  }

  async function calculateLoanDetails(loanData) {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post(
        `${getAPIURL()}/api/scenario/calculate-loan-details`,
        loanData
      )
      return response.data
    } catch (err) {
      console.error('Error calculating loan details:', err)
      error.value = err.message || 'Failed to calculate loan details'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    events,
    eventsByMonth,
    filteredEvents,
    combinedActiveEvents,
    loading,
    error,
    profile,
    currentDate,
    // Getters
    allEvents,
    monthlyEvents,
    getFilteredEvents,
    activeEvents,
    getCurrentDate,
    isLoading,
    hasError,
    selectedScenario,
    scenarios,
    cashFlowInTotal,
    cashFlowOutTotal,
    // Actions
    setProfile,
    setCurrentDate,
    fetchEvents,
    fetchEventsForMonthByScenario,
    fetchEventsForDateRange,
    convertMonthlyEventsToFiltered,
    filterEventsByDateRange,
    createEvent,
    updateEvent,
    deleteEvent,
    fetchEventById,
    reset,
    resetForNewUser,
    clearError,
    setFilteredEvents,
    getAllActiveScenarioEvents,
    calculateLoanDetails,
  }
})
