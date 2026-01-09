<template>
  <div class="q-pa-md">
    <q-list bordered separator>
      <q-item v-for="entry in entries" :key="entry.id">
        <q-item-section
          class="text-weight-bold"
          :class="useAmountColorClass(entry.amount)"
        >
          {{ entry.name }}
        </q-item-section>

        <q-item-section side
        class="text-weight-bold"
        :class="useAmountColorClass(entry.amount)"
        >
          {{ currencyFormat(entry.amount) }}
        </q-item-section>
      </q-item>
    </q-list>
  </div>
  <q-footer>
    <div class="row">
     <div class="col">
      <q-input placeholder="Name" bg-color="white" outlined dense/>
     </div>
      
    </div>
    <div class="row q-pa-sm q-col-gutter-sm">
      <div class="col">
        <q-input placeholder="Name" bg-color="white" outlined dense/>
      </div>
      <div class="col">
        <q-input placeholder="Amount" bg-color="white" type="number" step="0.01" input-class="text-right" outlined dense/>
      </div>
      <div class="col col-auto">
        <q-btn icon="add" color="primary" round/>
      </div>
    </div>
  </q-footer>
</template>

<script setup>
  import { ref } from 'vue'
  import { currencyFormat, useAmountColorClass } from 'src/js/utils'

const entries = ref([
  {
    id: 'id1',
    name: 'Salary',
    amount: 4999.99,
  },
  {
    id: 'id2',
    name: 'Rent',
    amount: -999.99,
  },
  {
    id: 'id3',
    name: 'Phone',
    amount: -251.53,
  },
  {
    id: 'id4',
    name: 'Unkown',
    amount: 0,
  },
])
</script>