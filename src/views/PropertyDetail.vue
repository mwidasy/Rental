<template>
  <div class="min-h-screen bg-slate-100 pb-20">
    <header class="bg-white px-4 py-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
      <RouterLink to="/properties" class="text-slate-500">←</RouterLink>
      <h1 class="text-lg font-bold text-slate-800 truncate">{{ property?.name || 'Loading...' }}</h1>
    </header>

    <main class="p-4 space-y-4">
      <p v-if="property?.address" class="text-sm text-slate-500">{{ property.address }}</p>

      <div class="flex justify-between items-center">
        <h2 class="font-semibold text-slate-700">Units</h2>
        <button @click="showForm = !showForm" class="text-sm font-medium text-slate-800 bg-slate-200 px-3 py-1.5 rounded-lg">
          {{ showForm ? 'Cancel' : '+ Add Unit' }}
        </button>
      </div>

      <!-- Add Unit Form -->
      <form v-if="showForm" @submit.prevent="addUnit" class="bg-white rounded-2xl shadow p-4 space-y-3">
        <input
          v-model="newUnit.unit_label"
          type="text"
          placeholder="Unit label (e.g. Unit A1)"
          required
          class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
        />
        <input
          v-model.number="newUnit.monthly_rent"
          type="number"
          placeholder="Monthly rent (TZS)"
          required
          min="0"
          class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
        />
        <input
          v-model.number="newUnit.deposit_amount"
          type="number"
          placeholder="Deposit amount (TZS)"
          min="0"
          class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
        />
        <button
          type="submit"
          :disabled="saving"
          class="w-full py-3 rounded-xl bg-slate-800 text-white font-medium disabled:opacity-50"
        >
          {{ saving ? 'Saving...' : 'Save Unit' }}
        </button>
      </form>

      <p v-if="loading" class="text-slate-500 text-center py-8">Loading units...</p>
      <p v-else-if="units.length === 0" class="text-slate-500 text-center py-8">No units yet.</p>

      <div v-for="unit in units" :key="unit.id" class="bg-white rounded-2xl shadow p-4">
        <div v-if="editingUnitId !== unit.id" class="flex justify-between items-center">
          <div>
            <h3 class="font-semibold text-slate-800">{{ unit.unit_label }}</h3>
            <p class="text-sm text-slate-500">TZS {{ formatMoney(unit.monthly_rent) }}/mo · Deposit {{ formatMoney(unit.deposit_amount) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="text-xs px-2 py-1 rounded-full"
              :class="unit.is_occupied ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'"
            >
              {{ unit.is_occupied ? 'Occupied' : 'Vacant' }}
            </span>
            <button @click="startEditUnit(unit)" class="text-xs text-slate-500 px-2 py-1">Edit</button>
            <button @click="deleteUnit(unit)" class="text-xs text-red-500 px-2 py-1">Delete</button>
          </div>
        </div>

        <form v-else @submit.prevent="saveUnitEdit(unit)" class="space-y-3">
          <input v-model="editUnitForm.unit_label" type="text" required class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
          <input v-model.number="editUnitForm.monthly_rent" type="number" min="0" required class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
          <input v-model.number="editUnitForm.deposit_amount" type="number" min="0" class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
          <div class="flex gap-2">
            <button type="submit" class="flex-1 py-2 rounded-xl bg-slate-800 text-white font-medium">Save</button>
            <button type="button" @click="editingUnitId = null" class="flex-1 py-2 rounded-xl bg-slate-200 text-slate-700 font-medium">Cancel</button>
          </div>
        </form>
      </div>

      <div class="flex justify-between items-center mt-6">
        <h2 class="font-semibold text-slate-700">Expenses</h2>
        <button @click="showExpenseForm = !showExpenseForm" class="text-sm font-medium text-slate-800 bg-slate-200 px-3 py-1.5 rounded-lg">
          {{ showExpenseForm ? 'Cancel' : '+ Add Expense' }}
        </button>
      </div>

      <form v-if="showExpenseForm" @submit.prevent="addExpense" class="bg-white rounded-2xl shadow p-4 space-y-3">
        <select v-model="newExpense.category" class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base">
          <option value="maintenance">Maintenance</option>
          <option value="utilities">Utilities</option>
          <option value="tax">Tax</option>
          <option value="insurance">Insurance</option>
          <option value="other">Other</option>
        </select>
        <input v-model.number="newExpense.amount" type="number" min="0" placeholder="Amount (TZS)" required
          class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
        <input v-model="newExpense.expense_date" type="date" required
          class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
        <input v-model="newExpense.notes" type="text" placeholder="Notes (optional)"
          class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
        <button type="submit" :disabled="savingExpense"
          class="w-full py-3 rounded-xl bg-slate-800 text-white font-medium disabled:opacity-50">
          {{ savingExpense ? 'Saving...' : 'Save Expense' }}
        </button>
      </form>

      <div class="bg-white rounded-2xl shadow p-4">
        <p class="text-sm text-slate-500 mb-3">Total expenses: TZS {{ formatMoney(totalExpenses) }}</p>
        <p v-if="expenses.length === 0" class="text-sm text-slate-400">No expenses logged yet.</p>
        <div v-for="e in expenses" :key="e.id" class="flex justify-between items-center py-2 border-b last:border-0">
          <div>
            <p class="text-sm font-medium text-slate-700 capitalize">{{ e.category }}</p>
            <p class="text-xs text-slate-400">{{ e.expense_date }}{{ e.notes ? ' · ' + e.notes : '' }}</p>
          </div>
          <p class="text-sm font-semibold text-red-600">TZS {{ formatMoney(e.amount) }}</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow p-4 space-y-2 mt-4">
        <h2 class="font-semibold text-slate-700">Net Income</h2>
        <div class="flex justify-between text-sm">
          <span class="text-slate-500">Total rent collected</span>
          <span class="font-medium text-green-600">TZS {{ formatMoney(totalIncome) }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-slate-500">Total expenses</span>
          <span class="font-medium text-red-600">TZS {{ formatMoney(totalExpenses) }}</span>
        </div>
        <div class="flex justify-between text-sm pt-2 border-t">
          <span class="font-semibold text-slate-700">Net</span>
          <span class="font-semibold" :class="netIncome >= 0 ? 'text-green-700' : 'text-red-700'">
            TZS {{ formatMoney(netIncome) }}
          </span>
        </div>
      </div>
    </main>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav.vue'

const route = useRoute()
const propertyId = route.params.id

const property = ref(null)
const units = ref([])
const loading = ref(true)
const showForm = ref(false)
const saving = ref(false)
const newUnit = ref({ unit_label: '', monthly_rent: null, deposit_amount: null })

const editingUnitId = ref(null)
const editUnitForm = ref({ unit_label: '', monthly_rent: null, deposit_amount: null })

const showExpenseForm = ref(false)
const savingExpense = ref(false)
const expenses = ref([])
const newExpense = ref({
  category: 'maintenance',
  amount: null,
  expense_date: new Date().toISOString().slice(0, 10),
  notes: '',
})

const totalIncome = ref(0)

function formatMoney(n) {
  return Number(n || 0).toLocaleString('en-US')
}

const totalExpenses = computed(() =>
  expenses.value.reduce((sum, e) => sum + Number(e.amount), 0)
)

const netIncome = computed(() => totalIncome.value - totalExpenses.value)

async function fetchProperty() {
  const { data } = await supabase.from('properties').select('*').eq('id', propertyId).single()
  property.value = data
}

async function fetchUnits() {
  loading.value = true
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: true })

  if (!error) units.value = data
  loading.value = false
}

async function addUnit() {
  saving.value = true
  const { error } = await supabase.from('units').insert({
    property_id: propertyId,
    unit_label: newUnit.value.unit_label,
    monthly_rent: newUnit.value.monthly_rent,
    deposit_amount: newUnit.value.deposit_amount || 0,
  })

  saving.value = false
  if (!error) {
    newUnit.value = { unit_label: '', monthly_rent: null, deposit_amount: null }
    showForm.value = false
    await fetchUnits()
  } else {
    alert(error.message)
  }
}

function startEditUnit(unit) {
  editingUnitId.value = unit.id
  editUnitForm.value = {
    unit_label: unit.unit_label,
    monthly_rent: unit.monthly_rent,
    deposit_amount: unit.deposit_amount,
  }
}

async function saveUnitEdit(unit) {
  const { error } = await supabase
    .from('units')
    .update({
      unit_label: editUnitForm.value.unit_label,
      monthly_rent: editUnitForm.value.monthly_rent,
      deposit_amount: editUnitForm.value.deposit_amount || 0,
    })
    .eq('id', unit.id)

  if (!error) {
    editingUnitId.value = null
    await fetchUnits()
  } else {
    alert(error.message)
  }
}

async function deleteUnit(unit) {
  if (unit.is_occupied) {
    alert('Cannot delete an occupied unit. End the lease first.')
    return
  }
  if (!confirm(`Delete unit "${unit.unit_label}"? This cannot be undone.`)) return

  const { error } = await supabase.from('units').delete().eq('id', unit.id)
  if (!error) {
    await fetchUnits()
  } else {
    alert(error.message)
  }
}

async function fetchExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('property_id', propertyId)
    .order('expense_date', { ascending: false })
  if (!error) expenses.value = data
}

async function addExpense() {
  savingExpense.value = true
  const { error } = await supabase.from('expenses').insert({
    property_id: propertyId,
    category: newExpense.value.category,
    amount: newExpense.value.amount,
    expense_date: newExpense.value.expense_date,
    notes: newExpense.value.notes || null,
  })

  savingExpense.value = false
  if (!error) {
    newExpense.value = {
      category: 'maintenance',
      amount: null,
      expense_date: new Date().toISOString().slice(0, 10),
      notes: '',
    }
    showExpenseForm.value = false
    await fetchExpenses()
  } else {
    alert(error.message)
  }
}

async function fetchIncome() {
  const unitIds = units.value.map(u => u.id)
  if (unitIds.length === 0) {
    totalIncome.value = 0
    return
  }

  const { data: leases } = await supabase
    .from('leases')
    .select('id')
    .in('unit_id', unitIds)

  const leaseIds = (leases ?? []).map(l => l.id)
  if (leaseIds.length === 0) {
    totalIncome.value = 0
    return
  }

  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .in('lease_id', leaseIds)
    .eq('payment_type', 'rent')

  totalIncome.value = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
}

onMounted(async () => {
  await fetchProperty()
  await fetchUnits()
  await fetchExpenses()
  await fetchIncome()
})
</script>