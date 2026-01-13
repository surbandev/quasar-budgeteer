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

  // Category colors - matches CSS variables
  const categoryColors = {
    HOUSING: '#9c27b0',
    MORTGAGE: '#9c27b0',
    RENT: '#9c27b0',
    'FOOD & DINING': '#4caf50',
    'FOOD & DRINKS': '#4caf50',
    GROCERY: '#4caf50',
    DINING: '#4caf50',
    TRANSPORTATION: '#2196f3',
    ENTERTAINMENT: '#f44336',
    SHOPPING: '#ff9800',
    UTILITIES: '#00bcd4',
    UTILITY: '#00bcd4',
    HEALTHCARE: '#e91e63',
    EDUCATION: '#3f51b5',
    SAVINGS: '#4caf50',
    SUBSCRIPTION: '#e91e63',
    INSURANCE: '#ff9800',
    AUTO_LOAN: '#607d8b',
    GENERIC_LOAN: '#607d8b',
    CREDIT_CARD: '#9c27b0',
    PHONE: '#00bcd4',
    PRIMARY_INCOME: '#2e7d32',
    SECONDARY_INCOME: '#4caf50',
    MISC: '#9e9e9e',
    MISCELLANEOUS: '#9e9e9e',
  }

  const categoryIcons = {
    HOUSING: 'home',
    MORTGAGE: 'home',
    RENT: 'home',
    'FOOD & DINING': 'restaurant',
    'FOOD & DRINKS': 'restaurant',
    GROCERY: 'shopping_cart',
    DINING: 'restaurant',
    TRANSPORTATION: 'directions_car',
    ENTERTAINMENT: 'movie',
    SHOPPING: 'shopping_bag',
    UTILITIES: 'bolt',
    UTILITY: 'bolt',
    HEALTHCARE: 'local_hospital',
    EDUCATION: 'school',
    SAVINGS: 'savings',
    SUBSCRIPTION: 'subscriptions',
    INSURANCE: 'shield',
    AUTO_LOAN: 'directions_car',
    GENERIC_LOAN: 'account_balance',
    CREDIT_CARD: 'credit_card',
    PHONE: 'phone',
    PRIMARY_INCOME: 'attach_money',
    SECONDARY_INCOME: 'attach_money',
    MISC: 'category',
    MISCELLANEOUS: 'category',
  }

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
    return Array.from({ length }, (_, i) => new Date().getFullYear() - startOffset + i)
  }

  const getCategoryColor = (category) => {
    return categoryColors[category?.toUpperCase()] || categoryColors.MISCELLANEOUS
  }

  const getCategoryIcon = (category) => {
    return categoryIcons[category?.toUpperCase()] || 'receipt'
  }

  // Brand icon mapping - maps transaction names to SVG file paths
  // Add new icons by adding entries here and placing the SVG file in src/assets/icons/brands/
  const brandIconMap = {
    spotify: 'Spotify.png',
    hulu: 'Hulu.jpeg',
    experian: 'Experian.png',
    expirian: 'Experian.png', // Common misspelling
    water: 'water.svg',
    'water bill': 'water.svg',
    utility: 'Utility.png',
    utilities: 'Utility.png',
    'west knox utility': 'Utility.png',
    internet: 'Utility.png',
    kub: 'Utility.png',
  }

  // Category-based icon mapping - maps category names to icon files
  const categoryIconMap = {
    PRIMARY_INCOME: 'paycheck.svg',
    SECONDARY_INCOME: 'paycheck.svg',
    SUBSCRIPTION: 'subscription.svg',
    UTILITY: 'Utility.png',
    UTILITIES: 'Utility.png',
    PHONE: 'Phone.jpg',
    CREDIT_CARD: 'CreditCard.png',
    MORTGAGE: 'WhiteHouse.png',
  }

  // Brand color mapping - maps transaction names to brand-specific colors
  // These override category colors when a brand icon is present
  const brandColors = {
    hulu: '#1A2B2C', // Dark teal from original Hulu brand
  }

  // Get brand icon SVG path by transaction name
  const getBrandIcon = (transactionName) => {
    if (!transactionName) return null

    // Normalize the name: lowercase, trim, remove special characters
    const normalizedName = transactionName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')

    // Try exact match first
    let iconPath = brandIconMap[normalizedName]

    // If no exact match, try partial matching
    if (!iconPath) {
      for (const [key, path] of Object.entries(brandIconMap)) {
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
          iconPath = path
          break
        }
      }
    }

    // If still no match, try to find by first word
    if (!iconPath) {
      const words = normalizedName.split(/\s+/)
      if (words.length > 0) {
        const firstWord = words[0]
        iconPath = brandIconMap[firstWord]
      }
    }

    return iconPath || null
  }

  // Get brand icon by category
  const getBrandIconByCategory = (category) => {
    if (!category) return null
    const normalizedCategory = category.toUpperCase()
    return categoryIconMap[normalizedCategory] || null
  }

  // Check if a transaction has a brand icon available
  const hasBrandIcon = (transactionName, category) => {
    return getBrandIcon(transactionName) !== null || getBrandIconByCategory(category) !== null
  }

  // Get brand color by transaction name (returns null if no brand color is set)
  const getBrandColor = (transactionName) => {
    if (!transactionName) return null

    // Normalize the name: lowercase, trim, remove special characters
    const normalizedName = transactionName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')

    // Try exact match first
    let brandColor = brandColors[normalizedName]

    // If no exact match, try partial matching
    if (!brandColor) {
      for (const [key, color] of Object.entries(brandColors)) {
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
          brandColor = color
          break
        }
      }
    }

    // If still no match, try to find by first word
    if (!brandColor) {
      const words = normalizedName.split(/\s+/)
      if (words.length > 0) {
        const firstWord = words[0]
        brandColor = brandColors[firstWord]
      }
    }

    return brandColor || null
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
    getCategoryColor,
    getCategoryIcon,
    getBrandIcon,
    getBrandIconByCategory,
    hasBrandIcon,
    getBrandColor,
  }
})
