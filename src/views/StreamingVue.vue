<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DangerButton from '@/components/DangerButton.vue'
import Modal from '@/components/Modal.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import StreamingService from '@/services/StreamingService'
import type { StreamingInterface } from '@/interfaces/StreamingInterface'
import Swal from 'sweetalert2'

const streamings = ref<StreamingInterface[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const isModalOpen = ref(false)
const editingStreamingId = ref<string>()
const title = ref('')

const modalTitle = () => editingStreamingId.value ? 'Edit streaming' : 'New streaming'

const formatDate = (date?: Date) => {
  if (!date) return 'Not informed'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

const loadStreamings = async () => {
  isLoading.value = true

  try {
    streamings.value = await StreamingService.index()
  } catch {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Unable to load streamings. Please try again.',
    })
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  editingStreamingId.value = undefined
  title.value = ''
  isModalOpen.value = true
}

const openEditModal = (streaming: StreamingInterface) => {
  editingStreamingId.value = streaming.id
  title.value = streaming.title
  isModalOpen.value = true
}

const closeModal = () => {
  if (!isSaving.value) isModalOpen.value = false
}

const saveStreaming = async () => {
  const normalizedTitle = title.value.trim()
  if (!normalizedTitle || isSaving.value) return

  isSaving.value = true

  try {
    if (editingStreamingId.value) {
      await StreamingService.update(editingStreamingId.value, { title: normalizedTitle })
    } else {
      await StreamingService.store({ title: normalizedTitle, createdAt: new Date() })
    }

    closeModal()
    await loadStreamings()
  } catch {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Unable to save this streaming. Please try again.',
    })
  } finally {
    isSaving.value = false
  }
}

const deleteStreaming = async (streaming: StreamingInterface) => {
  if (!streaming.id) return

  const result = await Swal.fire({
    title: 'Delete streaming?',
    text: `This will remove "${streaming.title}" from your library.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e85d4a',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
  })

  if (!result.isConfirmed) return

  try {
    await StreamingService.destroy(streaming.id)
    await loadStreamings()
  } catch {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Unable to delete this streaming. Please try again.',
    })
  }
}

onMounted(loadStreamings)
</script>

<template>
  <main class="min-h-[calc(100vh-155px)] bg-[#f8f7f3] px-5 py-10 sm:px-8 lg:py-16">
    <div class="mx-auto w-full flex flex-col gap-6"">
      <section class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div class="flex flex-col gap-6">
          <p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d84d3b]">Watch Later library</p>
          <h1 class="font-serif text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Streamings</h1>
          <p class="mt-3 max-w-xl text-slate-500">Manage the platforms where you watch your favorite shows.</p>
        </div>
        <PrimaryButton text="Add streaming" @click="openCreateModal" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]" aria-labelledby="streamings-heading">
        <h2 id="streamings-heading" class="sr-only">Registered streamings</h2>
        <div v-if="isLoading" class="px-6 py-16 text-center text-sm text-slate-500">Loading streamings...</div>
        <div v-else-if="streamings.length === 0" class="px-6 py-16 text-center">
          <p class="font-serif text-2xl font-bold text-slate-950">No streamings yet</p>
          <p class="mt-2 text-sm text-slate-500">Add your first streaming platform to get started.</p>
          <button type="button" class="mt-5 text-sm font-bold text-[#d84d3b] underline-offset-4 hover:underline" @click="openCreateModal">
            Add a streaming
          </button>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[600px] text-left">
            <thead class="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th scope="col" class="px-6 py-4 font-bold">Name</th>
                <th scope="col" class="px-6 py-4 font-bold">Added</th>
                <th scope="col" class="px-6 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="streaming in streamings" :key="streaming.id" class="transition-colors hover:bg-[#fffaf8]">
                <td class="px-6 py-5 font-semibold text-slate-900">{{ streaming.title }}</td>
                <td class="px-6 py-5 text-sm text-slate-500">{{ formatDate(streaming.createdAt) }}</td>
                <td class="px-6 py-4">
                  <div class="flex justify-end gap-2">
                    <button type="button" class="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-200" :aria-label="`Edit ${streaming.title}`" @click="openEditModal(streaming)">
                      Edit
                    </button>
                    <DangerButton text="Delete" @click="deleteStreaming(streaming)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <Modal v-if="isModalOpen" :title="modalTitle()" :submit-function="saveStreaming" :cancel-function="closeModal">
      <form class="space-y-2" @submit.prevent="saveStreaming">
        <label for="streaming-title" class="block text-sm font-bold text-slate-700">Streaming name</label>
        <input id="streaming-title" v-model="title" type="text" required maxlength="80" autofocus placeholder="e.g. Netflix" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-[#e85d4a] focus:ring-4 focus:ring-[#e85d4a]/15" />
      </form>
    </Modal>
  </main>
</template>