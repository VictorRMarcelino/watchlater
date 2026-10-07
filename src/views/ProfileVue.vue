<script setup lang="ts">
import { onMounted, ref } from 'vue'
import UserService from '@/services/UserService'
import Swal from 'sweetalert2'

const name = ref('')
const email = ref('')
const isLoading = ref(true)
const isSaving = ref(false)

const loadProfile = async () => {
  try {
    const profile = await UserService.getCurrentProfile()
    name.value = profile.name
    email.value = profile.email
  } catch {
    await Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: 'Não foi possível carregar seu perfil. Tente novamente.',
    })
  } finally {
    isLoading.value = false
  }
}

const saveProfile = async () => {
  const normalizedName = name.value.trim()
  const normalizedEmail = email.value.trim()
  if (!normalizedName || !normalizedEmail || isSaving.value) return

  isSaving.value = true

  try {
    const result = await UserService.updateCurrentProfile(normalizedName, normalizedEmail)
    name.value = normalizedName
    email.value = result.email
    if (result.emailVerificationPending) {
      await Swal.fire({
        icon: 'info',
        title: 'Confirme seu novo email',
        text: `Enviamos um link de confirmação para ${normalizedEmail}. O email será alterado após a confirmação.`,
      })
    } else {
      await Swal.fire({
        icon: 'success',
        title: 'Perfil atualizado',
        text: 'Seus dados foram salvos com sucesso.',
      })
    }
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : ''
    await Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: code === 'auth/email-already-in-use'
        ? 'Este email já está em uso. Informe outro endereço.'
        : code === 'auth/requires-recent-login'
          ? 'Para alterar seu email, saia e entre novamente antes de tentar de novo.'
          : 'Não foi possível salvar seu perfil. Verifique os dados e tente novamente.',
    })
  } finally {
    isSaving.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <main class="min-h-[calc(100vh-155px)] bg-[#f8f7f3] px-5 py-10 sm:px-8 lg:py-16">
    <div class="mx-auto w-full max-w-3xl">
      <section class="mb-8">
        <p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d84d3b]">Sua conta</p>
        <h1 class="font-serif text-4xl font-bold text-slate-950 sm:text-5xl">Perfil</h1>
        <p class="mt-3 max-w-xl text-slate-500">Atualize seu nome e email de acesso.</p>
      </section>

      <section class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-8" aria-label="Dados do perfil">
        <p v-if="isLoading" role="status" class="py-8 text-center text-sm text-slate-500">Carregando perfil...</p>
        <form v-else class="space-y-5" @submit.prevent="saveProfile">
          <div>
            <label for="profile-name" class="mb-2 block text-sm font-bold text-slate-700">Nome</label>
            <input id="profile-name" v-model="name" type="text" required maxlength="120" autocomplete="name" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-[#e85d4a] focus:ring-4 focus:ring-[#e85d4a]/15" />
          </div>
          <div>
            <label for="profile-email" class="mb-2 block text-sm font-bold text-slate-700">Email</label>
            <input id="profile-email" v-model="email" type="email" required maxlength="160" autocomplete="email" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-[#e85d4a] focus:ring-4 focus:ring-[#e85d4a]/15" />
          </div>
          <div class="flex justify-end border-t border-slate-100 pt-5">
            <button type="submit" :disabled="isSaving" class="rounded-xl bg-[#e85d4a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#d84d3b] focus:outline-none focus:ring-4 focus:ring-[#e85d4a]/20 disabled:cursor-wait disabled:opacity-60">
              {{ isSaving ? 'Salvando...' : 'Salvar alterações' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>