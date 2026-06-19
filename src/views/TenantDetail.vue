<template>
    <div class="min-h-screen bg-slate-100 pb-20">
      <header class="bg-white px-4 py-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <RouterLink to="/tenants" class="text-slate-500">←</RouterLink>
        <h1 class="text-lg font-bold text-slate-800 truncate">{{ tenant?.full_name || 'Loading...' }}</h1>
      </header>
  
      <main class="p-4 space-y-4">
        <div class="bg-white rounded-2xl shadow p-4 text-sm text-slate-600 space-y-1">
          <p v-if="tenant?.phone">📞 {{ tenant.phone }}</p>
          <p v-if="tenant?.email">✉️ {{ tenant.email }}</p>
          <p v-if="tenant?.national_id">🪪 {{ tenant.national_id }}</p>
        </div>
  
        <h2 class="font-semibold text-slate-700">Lease</h2>
  
        <!-- Existing lease -->
        <div v-if="lease" class="bg-white rounded-2xl shadow p-4 space-y-1">
          <p class="font-semibold text-slate-800">{{ lease.units.unit_label }} — {{ lease.units.properties.name }}</p>
          <p class="text-sm text-slate-500">Rent: TZS {{ formatMoney(lease.monthly_rent) }}/mo</p>
          <p class="text-sm text-slate-500">Move-in: {{ lease.move_in_date }}</p>
          <p class="text-sm text-slate-500">Expiry: {{ lease.lease_expiry }}</p>
          <span class="inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 mt-1">{{ lease.status }}</span>
        </div>
  
        <!-- Create lease form -->
        <form v-else @submit.prevent="createLease" class="bg-white rounded-2xl shadow p-4 space-y-3">
          <p v-if="vacantUnits.length === 0" class="text-sm text-slate-500">No vacant units available. Add a unit first.</p>
  
          <select v-else v-model="newLease.unit_id" required class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base">
            <option value="" disabled>Select a vacant unit</option>
            <option v-for="u in vacantUnits" :key="u.id" :value="u.id">
              {{ u.properties.name }} — {{ u.unit_label }} (TZS {{ formatMoney(u.monthly_rent) }})
            </option>
          </select>
  
          <label class="block text-xs text-slate-500">Move-in date</label>
          <input v-model="newLease.move_in_date" type="date" required class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
  
          <label class="block text-xs text-slate-500">Lease expiry</label>
          <input v-model="newLease.lease_expiry" type="date" required class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
  
          <label class="block text-xs text-slate-500">Deposit paid (TZS)</label>
          <input v-model.number="newLease.deposit_paid" type="number" min="0" class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
  
          <button type="submit" :disabled="saving || vacantUnits.length === 0"
            class="w-full py-3 rounded-xl bg-slate-800 text-white font-medium disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Create Lease' }}
          </button>
        </form>
  
        <!-- Payment form -->
        <div v-if="lease" class="bg-white rounded-2xl shadow p-4 space-y-3">
          <h3 class="font-semibold text-slate-700">Log Payment</h3>
          <form @submit.prevent="logPayment" class="space-y-3">
            <input v-model.number="newPayment.amount" type="number" min="0" placeholder="Amount (TZS)" required
              class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
  
            <select v-model="newPayment.payment_type" class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base">
              <option value="rent">Rent</option>
              <option value="deposit">Deposit</option>
              <option value="other">Other</option>
            </select>
  
            <select v-model="newPayment.payment_method" class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base">
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
  
            <input v-model="newPayment.payment_date" type="date" required class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
  
            <input v-model="newPayment.notes" type="text" placeholder="Notes (optional)" class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
  
            <button type="submit" :disabled="savingPayment" class="w-full py-3 rounded-xl bg-slate-800 text-white font-medium disabled:opacity-50">
              {{ savingPayment ? 'Saving...' : 'Log Payment' }}
            </button>
          </form>
        </div>
  
        <!-- Payment history -->
        <div v-if="lease" class="bg-white rounded-2xl shadow p-4">
          <h3 class="font-semibold text-slate-700 mb-2">Payment History</h3>
  
          <div class="flex gap-2 mb-3">
            <button @click="exportPDF" class="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 text-white">
              Export PDF
            </button>
            <button @click="exportCSV" class="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700">
              Export CSV
            </button>
          </div>
  
          <p class="text-sm text-slate-500 mb-3">
            Total paid: TZS {{ formatMoney(totalPaid) }} · Outstanding: TZS {{ formatMoney(outstanding) }}
          </p>
          <p v-if="payments.length === 0" class="text-sm text-slate-400">No payments logged yet.</p>
          <div v-for="p in payments" :key="p.id" class="flex justify-between items-center py-2 border-b last:border-0">
            <div>
              <p class="text-sm font-medium text-slate-700">TZS {{ formatMoney(p.amount) }} — {{ p.payment_type }}</p>
              <p class="text-xs text-slate-400">{{ p.payment_date }} · {{ p.payment_method }}</p>
            </div>
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
  import jsPDF from 'jspdf'
  import autoTable from 'jspdf-autotable'
  
  const route = useRoute()
  const tenantId = route.params.id
  
  const tenant = ref(null)
  const lease = ref(null)
  const vacantUnits = ref([])
  const saving = ref(false)
  
  const newLease = ref({ unit_id: '', move_in_date: '', lease_expiry: '', deposit_paid: 0 })
  
  const payments = ref([])
  const savingPayment = ref(false)
  const newPayment = ref({
    amount: null,
    payment_type: 'rent',
    payment_method: 'cash',
    payment_date: new Date().toISOString().slice(0, 10),
    notes: '',
  })
  
  function formatMoney(n) {
    return Number(n || 0).toLocaleString('en-US')
  }
  
  const totalPaid = computed(() =>
    payments.value
      .filter(p => p.payment_type === 'rent')
      .reduce((sum, p) => sum + Number(p.amount), 0)
  )
  
  // simple outstanding calc: months elapsed since move-in * rent - total rent paid
  const outstanding = computed(() => {
    if (!lease.value) return 0
    const moveIn = new Date(lease.value.move_in_date)
    const now = new Date()
    const monthsElapsed = Math.max(
      1,
      (now.getFullYear() - moveIn.getFullYear()) * 12 + (now.getMonth() - moveIn.getMonth()) + 1
    )
    const expected = monthsElapsed * Number(lease.value.monthly_rent)
    return Math.max(0, expected - totalPaid.value)
  })
  
  async function fetchTenant() {
    const { data } = await supabase.from('tenants').select('*').eq('id', tenantId).single()
    tenant.value = data
  }
  
  async function fetchLease() {
    const { data } = await supabase
      .from('leases')
      .select('*, units(unit_label, properties(name))')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .maybeSingle()
    lease.value = data
  }
  
  async function fetchVacantUnits() {
    const { data } = await supabase
      .from('units')
      .select('*, properties(name)')
      .eq('is_occupied', false)
    vacantUnits.value = data || []
  }
  
  async function createLease() {
    saving.value = true
  
    const selectedUnit = vacantUnits.value.find(u => u.id === newLease.value.unit_id)
  
    const { error: leaseError } = await supabase.from('leases').insert({
      unit_id: newLease.value.unit_id,
      tenant_id: tenantId,
      move_in_date: newLease.value.move_in_date,
      lease_expiry: newLease.value.lease_expiry,
      monthly_rent: selectedUnit.monthly_rent,
      deposit_paid: newLease.value.deposit_paid || 0,
      status: 'active',
    })
  
    if (!leaseError) {
      await supabase.from('units').update({ is_occupied: true }).eq('id', newLease.value.unit_id)
      await fetchLease()
      await fetchVacantUnits()
      await fetchPayments()
    } else {
      alert(leaseError.message)
    }
  
    saving.value = false
  }
  
  async function fetchPayments() {
    if (!lease.value) return
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('lease_id', lease.value.id)
      .order('payment_date', { ascending: false })
    if (!error) payments.value = data
  }
  
  async function logPayment() {
    savingPayment.value = true
    const { error } = await supabase.from('payments').insert({
      lease_id: lease.value.id,
      amount: newPayment.value.amount,
      payment_type: newPayment.value.payment_type,
      payment_method: newPayment.value.payment_method,
      payment_date: newPayment.value.payment_date,
      notes: newPayment.value.notes || null,
    })
  
    savingPayment.value = false
    if (!error) {
      newPayment.value = {
        amount: null,
        payment_type: 'rent',
        payment_method: 'cash',
        payment_date: new Date().toISOString().slice(0, 10),
        notes: '',
      }
      await fetchPayments()
    } else {
      alert(error.message)
    }
  }
  
  function exportPDF() {
    const doc = new jsPDF()
  
    doc.setFontSize(16)
    doc.text('Tenant Statement', 14, 18)
  
    doc.setFontSize(10)
    doc.text(`Tenant: ${tenant.value.full_name}`, 14, 28)
    doc.text(`Unit: ${lease.value.units.unit_label} — ${lease.value.units.properties.name}`, 14, 34)
    doc.text(`Move-in: ${lease.value.move_in_date}`, 14, 40)
    doc.text(`Monthly Rent: TZS ${formatMoney(lease.value.monthly_rent)}`, 14, 46)
    doc.text(`Total Paid: TZS ${formatMoney(totalPaid.value)}`, 14, 52)
    doc.text(`Outstanding: TZS ${formatMoney(outstanding.value)}`, 14, 58)
  
    autoTable(doc, {
      startY: 66,
      head: [['Date', 'Type', 'Method', 'Amount (TZS)', 'Notes']],
      body: payments.value.map(p => [
        p.payment_date,
        p.payment_type,
        p.payment_method,
        formatMoney(p.amount),
        p.notes || '',
      ]),
    })
  
    doc.save(`${tenant.value.full_name.replace(/\s+/g, '_')}_statement.pdf`)
  }
  
  function exportCSV() {
    const headers = ['Date', 'Type', 'Method', 'Amount', 'Notes']
    const rows = payments.value.map(p => [
      p.payment_date,
      p.payment_type,
      p.payment_method,
      p.amount,
      (p.notes || '').replace(/,/g, ';'),
    ])
  
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
  
    const link = document.createElement('a')
    link.href = url
    link.download = `${tenant.value.full_name.replace(/\s+/g, '_')}_payments.csv`
    link.click()
    URL.revokeObjectURL(url)
  }
  
  onMounted(async () => {
    await fetchTenant()
    await fetchLease()
    await fetchVacantUnits()
    await fetchPayments()
  })
  </script>