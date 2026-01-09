import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useScenariosStore } from './scenarios'
import { useEventsStore } from './events'
import { getAPIURL } from '../js/api'

export const useCalendarStore = defineStore('calendar', () => {
  // State
  const currentDate = ref(new Date())
  const selectedProfile = ref(null)
  const profile = ref(null)
  const calendarVersion = ref(0)
  const calendarDays = ref([])

  const eventsStore = useEventsStore()
  const scenariosStore = useScenariosStore()

  // Getters
  const getEventDisplayAmount = computed(() => {
    return (event) => {
      const loanCategories = ['MORTGAGE', 'GENERIC_LOAN', 'AUTO_LOAN']
      if (
        loanCategories.includes(event.category) &&
        event.monthly_payment &&
        event.monthly_payment > 0
      ) {
        if (event.category === 'MORTGAGE' && event.escrow && event.escrow > 0) {
          return parseFloat(event.monthly_payment) + parseFloat(event.escrow)
        }
        return event.monthly_payment
      }
      return event.amount
    }
  })

  const selectedScenario = computed(() => scenariosStore.selectedScenario)
  const scenarios = computed(() => scenariosStore.allScenarios)
  const events = computed(() => eventsStore.allEvents)
  const eventsByMonth = computed(() => eventsStore.monthlyEvents)
  const cashFlowInTotal = computed(() => eventsStore.cashFlowInTotal)
  const cashFlowOutTotal = computed(() => eventsStore.cashFlowOutTotal)

  const currentMonthYear = computed(() => {
    return currentDate.value.toLocaleString('default', { month: 'long', year: 'numeric' })
  })

  const netFlow = computed(() => {
    return calendarDaysCreditTotal.value - calendarDaysDebitTotal.value
  })

  const savings = computed(() => {
    return (calendarDaysCreditTotal.value - calendarDaysDebitTotal.value) * 0
  })

  const calendarDaysDebitTotal = computed(() => {
    let total = 0

    if (calendarDays.value && calendarDays.value.length > 0) {
      calendarDays.value.forEach((day) => {
        if (day.events && day.events.length > 0 && day.currentMonth) {
          day.events.forEach((event) => {
            if (event.type === 'DEBIT') {
              const loanCategories = ['MORTGAGE', 'GENERIC_LOAN', 'AUTO_LOAN']
              let amount
              if (
                loanCategories.includes(event.category) &&
                event.monthly_payment &&
                event.monthly_payment > 0
              ) {
                amount = parseFloat(event.monthly_payment)
                if (event.category === 'MORTGAGE' && event.escrow && event.escrow > 0) {
                  amount += parseFloat(event.escrow)
                }
              } else {
                amount = parseFloat(event.amount)
              }
              total += amount
            }
          })
        }
      })
    }
    return total
  })

  const calendarDaysCreditTotal = computed(() => {
    let total = 0

    if (calendarDays.value && calendarDays.value.length > 0) {
      calendarDays.value.forEach((day) => {
        if (day.events && day.events.length > 0 && day.currentMonth) {
          day.events.forEach((event) => {
            if (event.type === 'CREDIT') {
              const loanCategories = ['MORTGAGE', 'GENERIC_LOAN', 'AUTO_LOAN']
              let amount
              if (
                loanCategories.includes(event.category) &&
                event.monthly_payment &&
                event.monthly_payment > 0
              ) {
                amount = parseFloat(event.monthly_payment)
                if (event.category === 'MORTGAGE' && event.escrow && event.escrow > 0) {
                  amount += parseFloat(event.escrow)
                }
              } else {
                amount = parseFloat(event.amount)
              }
              total += amount
            }
          })
        }
      })
    }
    return total
  })

  // Actions
  async function fetchProfileInfo(profileID) {
    try {
      const url = `${getAPIURL()}/api/profile/get-profile-by-id`
      const response = await axios.get(url, {
        params: { profileID },
      })
      profile.value = response.data

      scenariosStore.setProfile(profile.value)
      eventsStore.setProfile(profile.value)
    } catch (err) {
      console.error('Error fetching profile info:', err)
    }
  }

  function updateCalendarDays() {
    const matchingEvents = eventsStore.monthlyEvents || []
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const today = new Date()
    const days = []

    const firstDayOfWeek = firstDay.getDay()
    const prevMonthLastDay = new Date(year, month, 0).getDate()

    const currentMonthEvents = matchingEvents.filter((eventData) => {
      const occurrenceDates =
        eventData.occurrences &&
        Array.isArray(eventData.occurrences) &&
        eventData.occurrences.length > 0
          ? eventData.occurrences
          : [eventData.event?.start_date].filter(Boolean)

      return occurrenceDates.some((occurrence) => {
        const tDateStr =
          typeof occurrence === 'string'
            ? occurrence.includes('T')
              ? occurrence.split('T')[0]
              : occurrence
            : new Date(occurrence).toISOString().split('T')[0]
        const [tYear, tMonth] = tDateStr.split('-').map(Number)
        return tYear === year && tMonth - 1 === month
      })
    })

    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i
      const day = new Date(year, month - 1, dayNum)
      let events = []

      for (let e of currentMonthEvents) {
        if (!e.occurrences || !Array.isArray(e.occurrences)) continue

        let occurrences =
          e.occurrences && Array.isArray(e.occurrences) && e.occurrences.length > 0
            ? e.occurrences
            : [e.event.start_date].filter(Boolean)

        for (let o of occurrences) {
          const occurrenceDateStr =
            typeof o === 'string'
              ? o.includes('T')
                ? o.split('T')[0]
                : o
              : new Date(o).toISOString().split('T')[0]
          const dayDateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`

          if (occurrenceDateStr === dayDateStr) {
            const loanCategories = ['MORTGAGE', 'GENERIC_LOAN', 'AUTO_LOAN']
            let displayAmount
            if (
              loanCategories.includes(e.event.category) &&
              e.event.monthly_payment &&
              e.event.monthly_payment > 0
            ) {
              if (e.event.category === 'MORTGAGE' && e.event.escrow && e.event.escrow > 0) {
                displayAmount = parseFloat(e.event.monthly_payment) + parseFloat(e.event.escrow)
              } else {
                displayAmount = e.event.monthly_payment
              }
            } else {
              displayAmount = e.event.amount
            }

            events.push({
              id: e.event.id,
              name: e.event.name,
              amount: displayAmount,
              type: e.event.type,
              startDate: e.event.start_date,
              endDate: e.event.end_date,
              frequency: e.event.frequency,
              category: e.event.category,
              description: e.event.description,
              active: e.event.active,
              profileID: e.event.profile_id,
              scenarioID: e.event.scenario_id,
              occurrences: e.occurrences,
            })
          }
        }
      }

      days.push({
        day: dayNum,
        currentMonth: false,
        date: day,
        hasEvents: events.length > 0,
        events,
        isToday: false,
      })
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i)
      day.setHours(0, 0, 0, 0)
      let events = []

      for (let e of currentMonthEvents) {
        if (!e.occurrences || !Array.isArray(e.occurrences)) continue

        let occurrences =
          e.occurrences && Array.isArray(e.occurrences) && e.occurrences.length > 0
            ? e.occurrences
            : [e.event.start_date].filter(Boolean)

        for (let o of occurrences) {
          const occurrenceDateStr =
            typeof o === 'string'
              ? o.includes('T')
                ? o.split('T')[0]
                : o
              : new Date(o).toISOString().split('T')[0]
          const dayDateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`

          if (occurrenceDateStr === dayDateStr) {
            const loanCategories = ['MORTGAGE', 'GENERIC_LOAN', 'AUTO_LOAN']
            let displayAmount
            if (
              loanCategories.includes(e.event.category) &&
              e.event.monthly_payment &&
              e.event.monthly_payment > 0
            ) {
              if (e.event.category === 'MORTGAGE' && e.event.escrow && e.event.escrow > 0) {
                displayAmount = parseFloat(e.event.monthly_payment) + parseFloat(e.event.escrow)
              } else {
                displayAmount = e.event.monthly_payment
              }
            } else {
              displayAmount = e.event.amount
            }

            events.push({
              id: e.event.id,
              name: e.event.name,
              amount: displayAmount,
              type: e.event.type,
              startDate: e.event.start_date,
              endDate: e.event.end_date,
              frequency: e.event.frequency,
              category: e.event.category,
              description: e.event.description,
              active: e.event.active,
              profileID: e.event.profile_id,
              scenarioID: e.event.scenario_id,
              occurrences: e.occurrences,
            })
          }
        }
      }

      days.push({
        day: i,
        currentMonth: true,
        date: day,
        hasEvents: events.length > 0,
        events,
        isToday:
          day.getDate() === today.getDate() &&
          day.getMonth() === today.getMonth() &&
          day.getFullYear() === today.getFullYear(),
      })
    }

    // Next month days
    const lastDayOfWeek = lastDay.getDay()
    const daysToAdd = 6 - lastDayOfWeek

    for (let i = 1; i <= daysToAdd; i++) {
      const day = new Date(year, month + 1, i)
      let events = []

      for (let e of currentMonthEvents) {
        if (!e.occurrences || !Array.isArray(e.occurrences)) continue

        let occurrences =
          e.occurrences && Array.isArray(e.occurrences) && e.occurrences.length > 0
            ? e.occurrences
            : [e.event.start_date].filter(Boolean)

        for (let o of occurrences) {
          const occurrenceDateStr =
            typeof o === 'string'
              ? o.includes('T')
                ? o.split('T')[0]
                : o
              : new Date(o).toISOString().split('T')[0]
          const dayDateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`

          if (occurrenceDateStr === dayDateStr) {
            const loanCategories = ['MORTGAGE', 'GENERIC_LOAN', 'AUTO_LOAN']
            let displayAmount
            if (
              loanCategories.includes(e.event.category) &&
              e.event.monthly_payment &&
              e.event.monthly_payment > 0
            ) {
              if (e.event.category === 'MORTGAGE' && e.event.escrow && e.event.escrow > 0) {
                displayAmount = parseFloat(e.event.monthly_payment) + parseFloat(e.event.escrow)
              } else {
                displayAmount = e.event.monthly_payment
              }
            } else {
              displayAmount = e.event.amount
            }

            events.push({
              id: e.event.id,
              name: e.event.name,
              amount: displayAmount,
              type: e.event.type,
              startDate: e.event.start_date,
              endDate: e.event.end_date,
              frequency: e.event.frequency,
              category: e.event.category,
              description: e.event.description,
              active: e.event.active,
              profileID: e.event.profile_id,
              scenarioID: e.event.scenario_id,
              occurrences: e.occurrences,
            })
          }
        }
      }

      days.push({
        day: i,
        currentMonth: false,
        date: day,
        hasEvents: events.length > 0,
        events,
        isToday: false,
      })
    }

    calendarDays.value = days
  }

  async function previousMonth() {
    const newDate = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
    currentDate.value = newDate
    calendarVersion.value++

    eventsStore.setCurrentDate(currentDate.value)
    await eventsStore.fetchEventsForMonthByScenario()
    await eventsStore.fetchEvents()
    updateCalendarDays()
  }

  async function nextMonth() {
    const newDate = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
    currentDate.value = newDate
    calendarVersion.value++

    eventsStore.setCurrentDate(currentDate.value)
    await eventsStore.fetchEventsForMonthByScenario()
    await eventsStore.fetchEvents()
    updateCalendarDays()
  }

  function resetCalendar() {
    currentDate.value = new Date()
    calendarDays.value = []
    calendarVersion.value = 0
  }

  function resetForNewUser() {
    try {
      resetCalendar()
      profile.value = null
      calendarDays.value = []

      scenariosStore.resetForNewUser()
      eventsStore.resetForNewUser()
    } catch (err) {
      console.error('Error resetting stores for new user:', err)
    }
  }

  async function setCalendarToDate(year, month, day = 1) {
    const newDate = new Date(year, month, day)
    currentDate.value = newDate
    calendarVersion.value++

    eventsStore.setCurrentDate(currentDate.value)
    await eventsStore.fetchEventsForMonthByScenario()
    await eventsStore.fetchEvents()
    updateCalendarDays()
  }

  return {
    // State
    currentDate,
    selectedProfile,
    profile,
    calendarVersion,
    calendarDays,
    // Getters
    getEventDisplayAmount,
    selectedScenario,
    scenarios,
    events,
    eventsByMonth,
    cashFlowInTotal,
    cashFlowOutTotal,
    currentMonthYear,
    netFlow,
    savings,
    calendarDaysDebitTotal,
    calendarDaysCreditTotal,
    // Actions
    fetchProfileInfo,
    updateCalendarDays,
    previousMonth,
    nextMonth,
    resetCalendar,
    resetForNewUser,
    setCalendarToDate,
  }
})
