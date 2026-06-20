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
      <div
        v-for="prop in properties"
        :key="prop.id"
        class="bg-white rounded-2xl shadow p-4"
      >
        <div v-if="editingId !== prop.id" class="flex justify-between items-start">
          <RouterLink :to="`/properties/${prop.id}`" class="flex-1">
            <h2 class="font-semibold text-slate-800">{{ prop.name }}</h2>
            <p v-if="prop.address" class="text-sm text-slate-500 mt-1">{{ prop.address }}</p>
            <p class="text-xs text-slate-400 mt-2">{{ prop.unit_count }} unit(s)</p>
          </RouterLink>
          <div class="flex gap-2">
            <button @click="startEdit(prop)" class="text-xs text-slate-500 px-2 py-1">Edit</button>
            <button @click="deleteProperty(prop)" class="text-xs text-red-500 px-2 py-1">Delete</button>
          </div>
        </div>

        <form v-else @submit.prevent="saveEdit(prop)" class="space-y-3">
          <input v-model="editForm.name" type="text" required class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
          <input v-model="editForm.address" type="text" placeholder="Address" class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base" />
          <div class="flex gap-2">
            <button type="submit" class="flex-1 py-2 rounded-xl bg-slate-800 text-white font-medium">Save</button>
            <button type="button" @click="editingId = null" class="flex-1 py-2 rounded-xl bg-slate-200 text-slate-700 font-medium">Cancel</button>
          </div>
        </form>
      </div>
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

const editingId = ref(null)
const editForm = ref({ name: '', address: '' })

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

function startEdit(prop) {
  editingId.value = prop.id
  editForm.value = { name: prop.name, address: prop.address || '' }
}

async function saveEdit(prop) {
  const { error } = await supabase
    .from('properties')
    .update({ name: editForm.value.name, address: editForm.value.address || null })
    .eq('id', prop.id)

  if (!error) {
    editingId.value = null
    await fetchProperties()
  } else {
    alert(error.message)
  }
}

async function deleteProperty(prop) {
  if (!confirm(`Delete "${prop.name}"? This will also delete all its units, leases, and payments. This cannot be undone.`)) return

  const { error } = await supabase.from('properties').delete().eq('id', prop.id)
  if (!error) {
    await fetchProperties()
  } else {
    alert(error.message)
  }
}

onMounted(fetchProperties)
</script>