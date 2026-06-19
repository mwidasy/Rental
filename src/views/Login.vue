<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-100">
    <div class="w-full max-w-sm bg-white rounded-2xl shadow p-6">
      <h1 class="text-xl font-bold text-slate-800 mb-1">Rental Manager</h1>
      <p class="text-sm text-slate-500 mb-6">Sign in to manage your properties</p>

      <form @submit.prevent="sendMagicLink" class="space-y-4">
        <input
          v-model="email"
          type="email"
          placeholder="you@example.com"
          required
          class="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-slate-800"
        />
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 rounded-xl bg-slate-800 text-white font-medium disabled:opacity-50"
        >
          {{ loading ? 'Sending...' : 'Send Magic Link' }}
        </button>
      </form>

      <p v-if="message" class="text-sm mt-4" :class="error ? 'text-red-600' : 'text-green-600'">
        {{ message }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const email = ref('')
const loading = ref(false)
const message = ref('')
const error = ref(false)

async function sendMagicLink() {
  loading.value = true
  message.value = ''
  error.value = false

  const { error: err } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: {
      emailRedirectTo: window.location.origin + '/dashboard',
    },
  })

  loading.value = false
  if (err) {
    error.value = true
    message.value = err.message
  } else {
    message.value = 'Check your email for the login link.'
  }
}
</script>