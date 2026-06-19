<template>
    <div class="min-h-screen bg-slate-100 pb-20">
      <header class="bg-white px-4 py-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <h1 class="text-lg font-bold text-slate-800">Tenants</h1>
        <button @click="showForm = !showForm" class="text-sm font-medium text-slate-800 bg-slate-200 px-3 py-1.5 rounded-lg">
          {{ showForm ? 'Cancel' : '+ Add' }}
        </button>
      </header>
  
      <main class="p-4 space-y-4">
        <form v-if="showForm" @submit.prevent="addTenant" class="bg-white rounded-2xl shadow p-4 space-y-3">
          <input v-model="newTenant.full_name" type="text" placeholder="Full name" required
            class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
          <input v-model="newTenant.phone" type="tel" placeholder="Phone (e.g. 0712345678)"
            class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
          <input v-model="newTenant.email" type="email" placeholder="Email (optional)"
            class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
          <input v-model="newTenant.national_id" type="text" placeholder="National ID (optional)"
            class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
          <button type="submit" :disabled="saving"
            class="w-full py-3 rounded-xl bg-slate-800 text-white font-medium disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Save Tenant' }}
          </button>
        </form>
  
        <p v-if="loading" class="text-slate-500 text-center py-8">Loading tenants...</p>
        <p v-else-if="tenants.length === 0" class="text-slate-500 text-center py-8">No tenants yet.</p>
  
        <RouterLink
          v-for="t in tenants"
          :key="t.id"
          :to="`/tenants/${t.id}`"
          class="block bg-white rounded-2xl shadow p-4"
        >
          <h2 class="font-semibold text-slate-800">{{ t.full_name }}</h2>
          <p v-if="t.phone" class="text-sm text-slate-500 mt-1">{{ t.phone }}</p>
        </RouterLink>
      </main>
  
      <BottomNav />
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { supabase } from '../lib/supabase'
  import BottomNav from '../components/BottomNav.vue'
  
  const tenants = ref([])
  const loading = ref(true)
  const showForm = ref(false)
  const saving = ref(false)
  const newTenant = ref({ full_name: '', phone: '', email: '', national_id: '' })
  
  async function fetchTenants() {
    loading.value = true
    const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false })
    if (!error) tenants.value = data
    loading.value = false
  }
  
  async function addTenant() {
    saving.value = true
    const { data: userData } = await supabase.auth.getUser()
  
    const { error } = await supabase.from('tenants').insert({
      owner_id: userData.user.id,
      full_name: newTenant.value.full_name,
      phone: newTenant.value.phone || null,
      email: newTenant.value.email || null,
      national_id: newTenant.value.national_id || null,
    })
  
    saving.value = false
    if (!error) {
      newTenant.value = { full_name: '', phone: '', email: '', national_id: '' }
      showForm.value = false
      await fetchTenants()
    } else {
      alert(error.message)
    }
  }
  
  onMounted(fetchTenants)
  </script>