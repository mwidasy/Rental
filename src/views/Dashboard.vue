<template>
  <div class="min-h-screen bg-slate-100 pb-20">
    <header class="bg-white px-4 py-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
      <h1 class="text-lg font-bold text-slate-800">Dashboard</h1>
      <button @click="signOut" class="text-sm text-slate-500">Sign Out</button>
    </header>

    <main class="p-4 space-y-4">
      <p v-if="loading" class="text-slate-500 text-center py-8">Loading stats...</p>

      <div v-else class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-white rounded-2xl shadow p-4">
            <p class="text-xs text-slate-400">Properties</p>
            <p class="text-2xl font-bold text-slate-800">{{ stats.propertyCount }}</p>
          </div>
          <div class="bg-white rounded-2xl shadow p-4">
            <p class="text-xs text-slate-400">Units</p>
            <p class="text-2xl font-bold text-slate-800">{{ stats.unitCount }}</p>
          </div>
          <div class="bg-white rounded-2xl shadow p-4">
            <p class="text-xs text-slate-400">Occupied</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.occupiedCount }}</p>
          </div>
          <div class="bg-white rounded-2xl shadow p-4">
            <p class="text-xs text-slate-400">Vacant</p>
            <p class="text-2xl font-bold text-amber-600">{{ stats.vacantCount }}</p>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow p-4 space-y-2">
          <h2 class="font-semibold text-slate-700">Income</h2>
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">Expected monthly</span>
            <span class="font-medium text-slate-800">TZS {{ formatMoney(stats.expectedMonthly) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">Outstanding (all tenants)</span>
            <span class="font-medium text-red-600">TZS {{ formatMoney(stats.totalOutstanding) }}</span>
          </div>
        </div>

        <div v-if="upcomingExpiries.length > 0" class="bg-white rounded-2xl shadow p-4 space-y-2">
          <h2 class="font-semibold text-slate-700">Leases Expiring Soon</h2>
          <RouterLink
            v-for="l in upcomingExpiries"
            :key="l.id"
            :to="`/tenants/${l.tenant_id}`"
            class="flex justify-between items-center py-2 border-b last:border-0"
          >
            <div>
              <p class="text-sm font-medium text-slate-700">{{ l.tenants.full_name }}</p>
              <p class="text-xs text-slate-400">{{ l.units.unit_label }} — {{ l.units.properties.name }}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">{{ l.lease_expiry }}</span>
          </RouterLink>
        </div>
      </div>
    </main>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav.vue'

const router = useRouter()
const loading = ref(true)

const stats = ref({
  propertyCount: 0,
  unitCount: 0,
  occupiedCount: 0,
  vacantCount: 0,
  expectedMonthly: 0,
  totalOutstanding: 0,
})

const upcomingExpiries = ref([])

function formatMoney(n) {
  return Number(n || 0).toLocaleString('en-US')
}

async function loadStats() {
  loading.value = true

  const { count: propertyCount } = await supabase.from('properties').select('*', { count: 'exact', head: true })
  const { data: units } = await supabase.from('units').select('*')
  const { data: leases } = await supabase
    .from('leases')
    .select('*, tenants(id, full_name), units(unit_label, properties(name))')
    .eq('status', 'active')
  const { data: payments } = await supabase.from('payments').select('amount, payment_type, lease_id')

  stats.value.propertyCount = propertyCount ?? 0
  stats.value.unitCount = units?.length ?? 0
  stats.value.occupiedCount = units?.filter(u => u.is_occupied).length ?? 0
  stats.value.vacantCount = stats.value.unitCount - stats.value.occupiedCount

  stats.value.expectedMonthly = (leases ?? []).reduce((sum, l) => sum + Number(l.monthly_rent), 0)

  const today = new Date()
  let totalOutstanding = 0

  for (const lease of leases ?? []) {
    const moveIn = new Date(lease.move_in_date)
    const monthsElapsed = Math.max(
      1,
      (today.getFullYear() - moveIn.getFullYear()) * 12 + (today.getMonth() - moveIn.getMonth()) + 1
    )
    const expected = monthsElapsed * Number(lease.monthly_rent)
    const paid = (payments ?? [])
      .filter(p => p.lease_id === lease.id && p.payment_type === 'rent')
      .reduce((sum, p) => sum + Number(p.amount), 0)
    totalOutstanding += Math.max(0, expected - paid)
  }
  stats.value.totalOutstanding = totalOutstanding

  upcomingExpiries.value = (leases ?? [])
    .map(l => ({ ...l, tenant_id: l.tenants.id }))
    .filter(l => {
      const days = Math.ceil((new Date(l.lease_expiry) - today) / (1000 * 60 * 60 * 24))
      return days >= 0 && days <= 30
    })
    .sort((a, b) => new Date(a.lease_expiry) - new Date(b.lease_expiry))

  loading.value = false
}

async function signOut() {
  await supabase.auth.signOut()
  router.push('/login')
}

onMounted(loadStats)
</script>