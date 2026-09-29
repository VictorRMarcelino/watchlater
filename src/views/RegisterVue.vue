<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import UserService from '@/services/UserService'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

const register = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await UserService.register(name.value.trim(), email.value.trim(), password.value)
    await router.push('/')
  } catch {
    errorMessage.value = 'Unable to create the account. Check the data and try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="flex min-h-[calc(100vh-155px)] items-center justify-center bg-[#f8f7f3] px-5 py-12 sm:px-8">
    <section class="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-8 gap-6 flex flex-col">
      <p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d84d3b]">Start watching</p>
      <h1 class="font-serif text-4xl font-bold tracking-tight text-slate-950">Create account</h1>
      <p class="mt-3 text-slate-500">Save your favorite shows in one place.</p>

      <p v-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ errorMessage }}</p>

      <form class="mt-7 space-y-5 gap-6 flex flex-col" @submit.prevent="register">
        <div>
          <label for="register-name" class="mb-2 block text-sm font-bold text-slate-700">Name</label>
          <input id="register-name" v-model="name" type="text" required maxlength="120" autocomplete="name" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-[#e85d4a] focus:ring-4 focus:ring-[#e85d4a]/15" />
        </div>
        <div>
          <label for="register-email" class="mb-2 block text-sm font-bold text-slate-700">Email</label>
          <input id="register-email" v-model="email" type="email" required maxlength="160" autocomplete="email" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-[#e85d4a] focus:ring-4 focus:ring-[#e85d4a]/15" />
        </div>
        <div>
          <label for="register-password" class="mb-2 block text-sm font-bold text-slate-700">Password</label>
          <input id="register-password" v-model="password" type="password" required minlength="6" autocomplete="new-password" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-[#e85d4a] focus:ring-4 focus:ring-[#e85d4a]/15" />
        </div>
        <button type="submit" :disabled="isSubmitting" class="w-full rounded-xl bg-[#e85d4a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#d84d3b] focus:outline-none focus:ring-4 focus:ring-[#e85d4a]/20 disabled:cursor-not-allowed disabled:opacity-60">
          {{ isSubmitting ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-500">Already have an account? <RouterLink to="/login" class="font-bold text-[#d84d3b] hover:underline">Sign in</RouterLink></p>
    </section>
  </main>
</template>