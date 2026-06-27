const VALID_CATEGORIES = new Set([
  'MORTGAGE',
  'RENT',
  'GROCERY',
  'DINING',
  'ENTERTAINMENT',
  'UTILITY',
  'SUBSCRIPTION',
  'INSURANCE',
  'GENERIC_LOAN',
  'AUTO_LOAN',
  'CREDIT_CARD',
  'PHONE',
  'PRIMARY_INCOME',
  'SECONDARY_INCOME',
  'MISC',
  'SAVINGS',
])

const CATEGORY_ALIASES = {
  UTILITIES: 'UTILITY',
  MISCELLANEOUS: 'MISC',
  HOUSING: 'RENT',
  'FOOD & DINING': 'DINING',
  'FOOD & DRINKS': 'GROCERY',
  TRANSPORTATION: 'MISC',
  SHOPPING: 'MISC',
  HEALTHCARE: 'INSURANCE',
  EDUCATION: 'MISC',
}

function normalizeCategory(category) {
  if (!category) {
    return 'MISC'
  }

  const raw = String(category).trim()
  const upper = raw.toUpperCase()

  if (VALID_CATEGORIES.has(upper)) {
    return upper
  }

  const alias = CATEGORY_ALIASES[raw] || CATEGORY_ALIASES[upper]
  if (alias) {
    return alias
  }

  return 'MISC'
}

function toApiDate(value) {
  if (value == null || value === '') {
    return null
  }

  const str = String(value).trim()
  const isoDate = str.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return isoDate
  }

  const parsed = new Date(str)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }

  return null
}

function toNumber(value, fallback = 0) {
  if (value == null || value === '') {
    return fallback
  }

  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function toActiveFlag(value) {
  return value === false || value === 0 || value === '0' ? 0 : 1
}

function normalizeEventFields(fields) {
  const term = fields.term ?? fields.loanTerm

  return {
    ...fields,
    category: normalizeCategory(fields.category),
    startDate: toApiDate(fields.startDate),
    endDate: toApiDate(fields.endDate),
    calculatedEndDate: toApiDate(fields.calculatedEndDate ?? fields.endDate),
    amount: toNumber(fields.amount),
    active: toActiveFlag(fields.active),
    principal: toNumber(fields.principal),
    interest: toNumber(fields.interest),
    monthlyPayment: toNumber(fields.monthlyPayment),
    term: toNumber(term),
    escrow: toNumber(fields.escrow),
    description: fields.description ?? '',
  }
}

module.exports = {
  normalizeCategory,
  normalizeEventFields,
  toApiDate,
}
