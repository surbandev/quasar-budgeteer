import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useConstantsStore = defineStore('constants', () => {
  // Static data - single source of truth
  const categoryOptions = [
    { label: 'Mortgage', value: 'MORTGAGE' },
    { label: 'Rent', value: 'RENT' },
    { label: 'Grocery', value: 'GROCERY' },
    { label: 'Dining', value: 'DINING' },
    { label: 'Entertainment', value: 'ENTERTAINMENT' },
    { label: 'Utilities', value: 'UTILITY' },
    { label: 'Subscription', value: 'SUBSCRIPTION' },
    { label: 'Insurance', value: 'INSURANCE' },
    { label: 'Generic Loan', value: 'GENERIC_LOAN' },
    { label: 'Auto Loan', value: 'AUTO_LOAN' },
    { label: 'Credit Card', value: 'CREDIT_CARD' },
    { label: 'Phone', value: 'PHONE' },
    { label: 'Savings', value: 'SAVINGS' },
    { label: 'Primary Income', value: 'PRIMARY_INCOME' },
    { label: 'Secondary Income', value: 'SECONDARY_INCOME' },
    { label: 'Misc Income', value: 'MISC' },
  ]

  const frequencyOptions = [
    { label: 'Once', value: 'ONCE' },
    { label: 'Daily', value: 'DAILY' },
    { label: 'Weekly', value: 'WEEKLY' },
    { label: 'Every Other Week', value: 'EVERY_OTHER_WEEK' },
    { label: 'Monthly', value: 'MONTHLY' },
    { label: 'Every Other Month', value: 'EVERY_OTHER_MONTH' },
    { label: 'Yearly', value: 'YEARLY' },
  ]

  const typeOptions = [
    { label: 'Income', value: 'CREDIT' },
    { label: 'Expense', value: 'DEBIT' },
  ]

  const loanTermOptions = [
    { label: '12 months (1 year)', value: '12' },
    { label: '24 months (2 years)', value: '24' },
    { label: '36 months (3 years)', value: '36' },
    { label: '48 months (4 years)', value: '48' },
    { label: '60 months (5 years)', value: '60' },
    { label: '72 months (6 years)', value: '72' },
    { label: '84 months (7 years)', value: '84' },
    { label: '96 months (8 years)', value: '96' },
    { label: '108 months (9 years)', value: '108' },
    { label: '120 months (10 years)', value: '120' },
    { label: '132 months (11 years)', value: '132' },
    { label: '144 months (12 years)', value: '144' },
    { label: '156 months (13 years)', value: '156' },
    { label: '168 months (14 years)', value: '168' },
    { label: '180 months (15 years)', value: '180' },
    { label: '192 months (16 years)', value: '192' },
    { label: '204 months (17 years)', value: '204' },
    { label: '216 months (18 years)', value: '216' },
    { label: '228 months (19 years)', value: '228' },
    { label: '240 months (20 years)', value: '240' },
    { label: '252 months (21 years)', value: '252' },
    { label: '264 months (22 years)', value: '264' },
    { label: '276 months (23 years)', value: '276' },
    { label: '288 months (24 years)', value: '288' },
    { label: '300 months (25 years)', value: '300' },
    { label: '312 months (26 years)', value: '312' },
    { label: '324 months (27 years)', value: '324' },
    { label: '336 months (28 years)', value: '336' },
    { label: '348 months (29 years)', value: '348' },
    { label: '360 months (30 years)', value: '360' },
  ]

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ]

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const themeOptions = [
    { label: 'Dark', value: 'dark' },
    { label: 'Light', value: 'light' },
  ]

  // Getters
  const getCategoryOptions = computed(() => categoryOptions)
  const getFrequencyOptions = computed(() => frequencyOptions)
  const getTypeOptions = computed(() => typeOptions)
  const getLoanTermOptions = computed(() => loanTermOptions)
  const getMonths = computed(() => months)
  const getDaysOfWeek = computed(() => daysOfWeek)
  const getThemeOptions = computed(() => themeOptions)

  // Helper functions
  const isLoanCategory = (category) => {
    const loanCategories = ['MORTGAGE', 'AUTO_LOAN', 'GENERIC_LOAN']
    return loanCategories.includes(category)
  }

  const getYears = (startOffset = 20, length = 60) => {
    return Array.from(
      { length },
      (_, i) => new Date().getFullYear() - startOffset + i
    )
  }

  return {
    // Getters
    getCategoryOptions,
    getFrequencyOptions,
    getTypeOptions,
    getLoanTermOptions,
    getMonths,
    getDaysOfWeek,
    getThemeOptions,
    // Helper functions
    isLoanCategory,
    getYears,
  }
})
