<template>
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-10">
      <RouterLink to="/properties" class="flex flex-col items-center text-xs px-3 py-1" :class="navClass('/properties')">
        <span class="text-xl">🏠</span> Properties
      </RouterLink>
      <RouterLink to="/tenants" class="flex flex-col items-center text-xs px-3 py-1" :class="navClass('/tenants')">
        <span class="text-xl">👤</span> Tenants
      </RouterLink>
      <RouterLink to="/payments" class="flex flex-col items-center text-xs px-3 py-1" :class="navClass('/payments')">
        <span class="text-xl">💰</span> Payments
      </RouterLink>
      <RouterLink to="/dashboard" class="flex flex-col items-center text-xs px-3 py-1" :class="navClass('/dashboard')">
        <span class="text-xl">📊</span> Stats
      </RouterLink>
    </nav>
  </template>
  
  <script setup>
  import { useRoute } from 'vue-router'
  const route = useRoute()
  function navClass(path) {
    return route.path.startsWith(path) ? 'text-slate-900 font-semibold' : 'text-slate-500'
  }
  </script>