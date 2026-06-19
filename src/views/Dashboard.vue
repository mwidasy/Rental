<template>
    <div class="min-h-screen bg-slate-100 pb-20">
      <header class="bg-white px-4 py-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <h1 class="text-lg font-bold text-slate-800">Dashboard</h1>
        <button @click="signOut" class="text-sm text-slate-500">Sign Out</button>
      </header>
  
      <main class="p-4">
        <p class="text-slate-600">Welcome. Properties, payments, and stats will go here.</p>
      </main>
  
      <nav class="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-10">
        <button class="flex flex-col items-center text-xs text-slate-700 px-3 py-1">
          <span class="text-xl">🏠</span> Properties
        </button>
        <button class="flex flex-col items-center text-xs text-slate-700 px-3 py-1">
          <span class="text-xl">👤</span> Tenants
        </button>
        <button class="flex flex-col items-center text-xs text-slate-700 px-3 py-1">
          <span class="text-xl">💰</span> Payments
        </button>
        <button class="flex flex-col items-center text-xs text-slate-700 px-3 py-1">
          <span class="text-xl">📊</span> Stats
        </button>
      </nav>
    </div>
  </template>
  
  <script setup>
  import { useRouter } from 'vue-router'
  import { supabase } from '../lib/supabase'
  
  const router = useRouter()
  
  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }
  </script>