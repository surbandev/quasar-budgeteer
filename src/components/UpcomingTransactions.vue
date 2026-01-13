<template>
  <q-card class="glass-card q-mt-lg">
    <q-card-section>
      <h3 class="upcoming-title">Upcoming transactions</h3>
      <div class="upcoming-total-expenses">
        <span class="total-label">Total expenses left this month:</span>
        <span class="total-amount negative">${{ totalUpcomingExpenses.toFixed(2) }}</span>
      </div>
      <div class="upcoming-transactions-list">
        <div
          v-for="transaction in upcomingTransactions"
          :key="transaction.id || transaction._id"
          class="upcoming-transaction-item"
        >
          <div class="transaction-left-section">
            <div class="days-remaining-pill">{{ transaction.daysRemaining }} DAYS</div>
            <div class="transaction-icon-wrapper">
              <div
                class="transaction-icon"
                :class="{ 'has-brand-icon': hasBrandIcon(transaction.name, transaction.category) }"
                :style="
                  hasBrandIcon(transaction.name, transaction.category)
                    ? {}
                    : { backgroundColor: getIconColor(transaction.name, transaction.category) }
                "
              >
                <BrandIcon
                  :transaction-name="transaction.name"
                  :category="transaction.category"
                  size="24px"
                  color="white"
                />
              </div>
            </div>
            <div class="transaction-details">
              <div class="transaction-name">
                {{ transaction.name || 'Unnamed Transaction' }}
              </div>
            </div>
          </div>
          <div class="transaction-amount">
            ${{ (getEventDisplayAmount(transaction) || 0).toFixed(2) }}
          </div>
        </div>
        <div v-if="upcomingTransactions.length === 0" class="no-upcoming-transactions">
          <span>No upcoming transactions for this month</span>
        </div>
      </div>
      <q-btn
        v-if="upcomingTransactions.length > 0"
        flat
        no-caps
        class="see-all-btn"
        @click="goToEntries"
      >
        See all upcoming transactions
      </q-btn>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConstantsStore } from '../stores/constants'
import BrandIcon from './BrandIcon.vue'

const props = defineProps({
  calendarDays: {
    type: Array,
    required: true,
    default: () => [],
  },
})

const router = useRouter()
const constantsStore = useConstantsStore()

// Compute upcoming transactions for the selected month
const upcomingTransactions = computed(() => {
  if (!props.calendarDays || !Array.isArray(props.calendarDays)) {
    return []
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  today.setMinutes(0, 0, 0)
  today.setSeconds(0, 0)
  today.setMilliseconds(0)

  // Collect all events from calendar days that are in the current month and future
  const upcomingEvents = []

  props.calendarDays.forEach((day) => {
    // Only process days in the current month
    if (!day.currentMonth) return

    if (!day.events || day.events.length === 0) return

    // Create a proper date object from day.date
    const dayDate = new Date(day.date)
    dayDate.setHours(0, 0, 0, 0)
    dayDate.setMinutes(0, 0, 0)
    dayDate.setSeconds(0, 0)
    dayDate.setMilliseconds(0)

    // Only include future dates (strictly after today, not including today)
    if (dayDate > today) {
      day.events.forEach((event) => {
        const daysRemaining = Math.ceil((dayDate - today) / (1000 * 60 * 60 * 24))

        upcomingEvents.push({
          ...event,
          date: dayDate.toISOString().split('T')[0],
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        })
      })
    }
  })

  // Sort by date (earliest first) and limit to 10
  return upcomingEvents
    .sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateA - dateB
    })
    .slice(0, 10)
})

const totalUpcomingExpenses = computed(() => {
  if (!upcomingTransactions.value || upcomingTransactions.value.length === 0) {
    return 0
  }

  return upcomingTransactions.value
    .filter((transaction) => transaction.type === 'DEBIT')
    .reduce((total, transaction) => {
      return total + (getEventDisplayAmount(transaction) || 0)
    }, 0)
})

function getEventDisplayAmount(event) {
  if (!event) return 0

  // Check for loan categories first - use monthly_payment instead of total loan amount
  const loanCategories = ['MORTGAGE', 'GENERIC_LOAN', 'AUTO_LOAN']
  if (
    loanCategories.includes(event.category) &&
    event.monthly_payment &&
    event.monthly_payment > 0
  ) {
    if (event.category === 'MORTGAGE' && event.escrow && event.escrow > 0) {
      return parseFloat(event.monthly_payment) + parseFloat(event.escrow)
    }
    return parseFloat(event.monthly_payment)
  }

  // For non-loan categories, use the regular amount
  const amount = event.amount
  if (amount !== undefined && amount !== null) {
    return parseFloat(amount) || 0
  }

  return 0
}

function getIconColor(transactionName, category) {
  // Check for brand color first, then fall back to category color
  const brandColor = constantsStore.getBrandColor(transactionName)
  return brandColor || constantsStore.getCategoryColor(category)
}

function hasBrandIcon(transactionName, category) {
  return constantsStore.hasBrandIcon(transactionName, category)
}

function goToEntries() {
  router.push('/entries')
}
</script>

<style scoped lang="scss">
// Upcoming Transactions Component Styles
.upcoming-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  letter-spacing: -0.3px;
}

.upcoming-total-expenses {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 0;
  margin-bottom: 1.5rem;
}

.total-label {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.total-amount {
  font-size: 1.2rem;
  font-weight: 700;

  &.negative {
    color: var(--color-negative);
  }
}

.upcoming-transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.upcoming-transaction-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px dashed var(--border-dashed);
  position: relative;

  &:last-child {
    border-bottom: none;
  }
}

.transaction-left-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  position: relative;
}

.days-remaining-pill {
  background: var(--bg-pill);
  color: var(--text-pill);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  white-space: nowrap;
  min-width: 60px;
  text-align: center;
}

.transaction-icon-wrapper {
  position: relative;
  margin-left: 0.5rem;

  &::before {
    content: '';
    position: absolute;
    left: -0.5rem;
    top: 50%;
    transform: translateY(-50%);
    width: 2px;
    height: 100%;
    background: repeating-linear-gradient(
      to bottom,
      var(--border-primary) 0px,
      var(--border-primary) 4px,
      transparent 4px,
      transparent 8px
    );
  }
}

.transaction-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;

  &.has-brand-icon {
    background-color: transparent !important;
  }
}

.transaction-details {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.transaction-name {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.transaction-amount {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  margin-left: 1rem;
}

.no-upcoming-transactions {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.see-all-btn {
  width: 100%;
  padding: 0.875rem;
  background: var(--bg-button);
  border: 2px solid var(--border-secondary);
  border-radius: 12px;
  color: var(--text-primary);
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: var(--bg-button-hover);
    border-color: var(--border-primary);
  }
}

// Mobile optimization for upcoming transactions
@media (max-width: 768px) {
  .upcoming-title {
    font-size: 1.25rem;
    margin-bottom: 0.875rem;
  }

  .upcoming-total-expenses {
    padding: 0.75rem 0;
    margin-bottom: 1.25rem;
  }

  .total-label {
    font-size: 0.875rem;
  }

  .total-amount {
    font-size: 1.1rem;
  }

  .upcoming-transaction-item {
    padding: 0.875rem 0;
  }

  .transaction-left-section {
    gap: 0.75rem;
  }

  .days-remaining-pill {
    font-size: 0.65rem;
    padding: 0.2rem 0.6rem;
    min-width: 50px;
  }

  .transaction-icon {
    width: 36px;
    height: 36px;

    .q-icon {
      font-size: 18px !important;
    }
  }

  .transaction-name {
    font-size: 0.9rem;
  }

  .transaction-amount {
    font-size: 0.9rem;
  }
}
</style>
