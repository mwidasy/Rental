<template>
  <div class="min-h-screen bg-slate-100 pb-20">
    <header class="bg-white px-4 py-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
      <h1 class="text-lg font-bold text-slate-800">Dashboard</h1>
      <button @click="signOut" class="text-sm text-slate-500">Sign Out</button>
    </header>

    <main class="p-4">
      <p class="text-slate-600">Welcome. Properties, payments, and stats will go here.</p>
    </main>

    <BottomNav />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav.vue'

const router = useRouter()

async function signOut() {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>