<template>
    <div class="min-h-screen bg-slate-100 pb-20">
      <header class="bg-white px-4 py-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <h1 class="text-lg font-bold text-slate-800">Properties</h1>
        <button @click="showForm = !showForm" class="text-sm font-medium text-slate-800 bg-slate-200 px-3 py-1.5 rounded-lg">
          {{ showForm ? 'Cancel' : '+ Add' }}
        </button>
      </header>
  
      <main class="p-4 space-y-4">
        <!-- Add Property Form -->
        <form v-if="showForm" @submit.prevent="addProperty" class="bg-white rounded-2xl shadow p-4 space-y-3">
          <input
            v-model="newProperty.name"
            type="text"
            placeholder="Property name (e.g. Mbeya Heights)"
            required
            class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
          />
          <input
            v-model="newProperty.address"
            type="text"
            placeholder="Address (optional)"
            class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
          />
          <button
            type="submit"
            :disabled="saving"
            class="w-full py-3 rounded-xl bg-slate-800 text-white font-medium disabled:opacity-50"
          >
            {{ saving ? 'Saving...' : 'Save Property' }}
          </button>
        </form>
  
        <!-- Loading -->
        <p v-if="loading" class="text-slate-500 text-center py-8">Loading properties...</p>
  
        <!-- Empty state -->
        <p v-else-if="properties.length === 0" class="text-slate-500 text-center py-8">
          No properties yet. Tap "+ Add" to create one.
        </p>
  
        <!-- Property cards -->
        <RouterLink
          v-for="prop in properties"
          :key="prop.id"
          :to="`/properties/${prop.id}`"
          class="block bg-white rounded-2xl shadow p-4"
        >
          <h2 class="font-semibold text-slate-800">{{ prop.name }}</h2>
          <p v-if="prop.address" class="text-sm text-slate-500 mt-1">{{ prop.address }}</p>
          <p class="text-xs text-slate-400 mt-2">{{ prop.unit_count }} unit(s)</p>
        </RouterLink>
      </main>
  
      <BottomNav />
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { supabase } from '../lib/supabase'
  import BottomNav from '../components/BottomNav.vue'
  
  const properties = ref([])
  const loading = ref(true)
  const showForm = ref(false)
  const saving = ref(false)
  const newProperty = ref({ name: '', address: '' })
  
  async function fetchProperties() {
    loading.value = true
    const { data, error } = await supabase
      .from('properties')
      .select('*, units(count)')
      .order('created_at', { ascending: false })
  
    if (!error && data) {
      properties.value = data.map(p => ({
        ...p,
        unit_count: p.units?.[0]?.count ?? 0,
      }))
    }
    loading.value = false
  }
  
  async function addProperty() {
    saving.value = true
    const { data: userData } = await supabase.auth.getUser()
  
    const { error } = await supabase.from('properties').insert({
      owner_id: userData.user.id,
      name: newProperty.value.name,
      address: newProperty.value.address || null,
    })
  
    saving.value = false
    if (!error) {
      newProperty.value = { name: '', address: '' }
      showForm.value = false
      await fetchProperties()
    } else {
      alert(error.message)
    }
  }
  
  onMounted(fetchProperties)
  </script>