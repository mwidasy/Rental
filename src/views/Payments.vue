<template>
  <div class="min-h-screen bg-slate-100 pb-20">
    <header class="bg-white px-4 py-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
      <h1 class="text-lg font-bold text-slate-800">Payments</h1>
    </header>

    <main class="p-4 space-y-3">
      <p v-if="loading" class="text-slate-500 text-center py-8">Loading payments...</p>
      <p v-else-if="payments.length === 0" class="text-slate-500 text-center py-8">No payments logged yet.</p>

      <RouterLink
        v-for="p in payments"
        :key="p.id"
        :to="`/tenants/${p.leases.tenants.id}`"
        class="block bg-white rounded-2xl shadow p-4"
      >
        <div class="flex justify-between items-start">
          <div>
            <p class="font-semibold text-slate-800">{{ p.leases.tenants.full_name }}</p>
            <p class="text-xs text-slate-400">{{ p.leases.units.unit_label }} — {{ p.leases.units.properties.name }}</p>
          </div>
          <p class="font-semibold text-slate-800">TZS {{ formatMoney(p.amount) }}</p>
        </div>
        <p class="text-xs text-slate-400 mt-1">{{ p.payment_date }} · {{ p.payment_type }} · {{ p.payment_method }}</p>
      </RouterLink>
    </main>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav.vue'

const payments = ref([])
const loading = ref(true)

function formatMoney(n) {
  return Number(n || 0).toLocaleString('en-US')
}

async function fetchPayments() {
  loading.value = true
  const { data, error } = await supabase
    .from('payments')
    .select('*, leases(tenants(id, full_name), units(unit_label, properties(name)))')
    .order('payment_date', { ascending: false })

  if (!error) payments.value = data
  loading.value = false
}

onMounted(fetchPayments)
</script>