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
  
        <div v-for="unit in units" :key="unit.id" class="bg-white rounded-2xl shadow p-4 flex justify-between items-center">
          <div>
            <h3 class="font-semibold text-slate-800">{{ unit.unit_label }}</h3>
            <p class="text-sm text-slate-500">TZS {{ formatMoney(unit.monthly_rent) }}/mo · Deposit {{ formatMoney(unit.deposit_amount) }}</p>
          </div>
          <span
            class="text-xs px-2 py-1 rounded-full"
            :class="unit.is_occupied ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'"
          >
            {{ unit.is_occupied ? 'Occupied' : 'Vacant' }}
          </span>
        </div>
      </main>
  
      <BottomNav />
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
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
  
  function formatMoney(n) {
    return Number(n || 0).toLocaleString('en-US')
  }
  
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
  
  onMounted(() => {
    fetchProperty()
    fetchUnits()
  })
  </script>