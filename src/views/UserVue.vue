<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import DangerButton from '@/components/DangerButton.vue'
import Modal from '@/components/Modal.vue'
import UserService from '@/services/UserService'
import type { UserInterface } from '@/interfaces/UserInterface'
import Swal from 'sweetalert2'

const users = ref<UserInterface[]>([])
const router = useRouter()
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const isModalOpen = ref(false)
const editingUserId = ref<string>()
const name = ref('')
const email = ref('')

const modalTitle = () => 'Edit user'

const loadUsers = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    users.value = await UserService.index()
  } catch {
    errorMessage.value = 'Unable to load users. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const openEditModal = (user: UserInterface) => {
  editingUserId.value = user.id
  name.value = user.name
  email.value = user.email
  isModalOpen.value = true
}

const closeModal = () => {
  if (!isSaving.value) isModalOpen.value = false
}

const saveUser = async () => {
  const normalizedName = name.value.trim()
  const normalizedEmail = email.value.trim()
  if (!normalizedName || !normalizedEmail || !editingUserId.value || isSaving.value) return

  isSaving.value = true
  errorMessage.value = ''

  try {
    await UserService.update(editingUserId.value, { name: normalizedName, email: normalizedEmail })

    closeModal()
    await loadUsers()
  } catch {
    errorMessage.value = 'Unable to save this user. Please try again.'
  } finally {
    isSaving.value = false
  }
}

const deleteUser = async (user: UserInterface) => {
  if (!user.id) return

  const result = await Swal.fire({
    title: 'Delete user?',
    text: `This will remove "${user.name}" from your users.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e85d4a',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
  })

  if (!result.isConfirmed) return

  errorMessage.value = ''
  try {
    const deletesCurrentUser = await UserService.destroy(user.id)

    if (deletesCurrentUser) {
      await router.push('/login')
      return
    }

    await loadUsers()
  } catch {
    errorMessage.value = 'Unable to delete this user. Please try again.'
  }
}

onMounted(loadUsers)
</script>

<template>
  <main class="min-h-[calc(100vh-155px)] bg-[#f8f7f3] px-5 py-10 sm:px-8 lg:py-16">
    <div class="mx-auto w-full">
      <section class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d84d3b]">Watchlater account</p>
          <h1 class="font-serif text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Users</h1>
          <p class="mt-3 max-w-xl text-slate-500">Manage the people with access to your Watchlater account.</p>
        </div>
      </section>

      <p v-if="errorMessage" role="alert" class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ errorMessage }}</p>

      <section class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]" aria-labelledby="users-heading">
        <h2 id="users-heading" class="sr-only">Registered users</h2>
        <div v-if="isLoading" class="px-6 py-16 text-center text-sm text-slate-500">Loading users...</div>
        <div v-else-if="users.length === 0" class="px-6 py-16 text-center">
          <p class="font-serif text-2xl font-bold text-slate-950">No users yet</p>
          <p class="mt-2 text-sm text-slate-500">Users are created through the registration screen.</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-155 text-left">
            <thead class="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th scope="col" class="px-6 py-4 font-bold">Name</th>
                <th scope="col" class="px-6 py-4 font-bold">Email</th>
                <th scope="col" class="px-6 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="user in users" :key="user.id" class="transition-colors hover:bg-[#fffaf8]">
                <td class="px-6 py-5 font-semibold text-slate-900">{{ user.name }}</td>
                <td class="px-6 py-5 text-sm text-slate-500">{{ user.email }}</td>
                <td class="px-6 py-4">
                  <div class="flex justify-end gap-2">
                    <button type="button" class="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-200" :aria-label="`Edit ${user.name}`" @click="openEditModal(user)">Edit</button>
                    <DangerButton text="Delete" @click="deleteUser(user)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <Modal v-if="isModalOpen" :title="modalTitle()" :submit-function="saveUser" :cancel-function="closeModal">
      <form class="space-y-4" @submit.prevent="saveUser">
        <div>
          <label for="user-name" class="mb-2 block text-sm font-bold text-slate-700">Name</label>
          <input id="user-name" v-model="name" type="text" required maxlength="120" autofocus placeholder="e.g. Alex Johnson" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-[#e85d4a] focus:ring-4 focus:ring-[#e85d4a]/15" />
        </div>
        <div>
          <label for="user-email" class="mb-2 block text-sm font-bold text-slate-700">Email</label>
          <input id="user-email" v-model="email" type="email" required maxlength="160" placeholder="alex@example.com" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-[#e85d4a] focus:ring-4 focus:ring-[#e85d4a]/15" />
        </div>
      </form>
    </Modal>
  </main>
</template>