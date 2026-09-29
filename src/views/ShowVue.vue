<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DangerButton from '@/components/DangerButton.vue'
import Modal from '@/components/Modal.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import ShowService from '@/services/ShowService'
import StreamingService from '@/services/StreamingService'
import type { ShowInterface } from '@/interfaces/ShowInterface'
import type { StreamingInterface } from '@/interfaces/StreamingInterface'
import Swal from 'sweetalert2'

const shows = ref<ShowInterface[]>([])
const streamings = ref<StreamingInterface[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const isModalOpen = ref(false)
const editingShowId = ref<string>()
const title = ref('')
const notes = ref('')
const whereToWatch = ref('')

const modalTitle = () => editingShowId.value ? 'Edit show' : 'New show'

const loadShows = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [loadedShows, loadedStreamings] = await Promise.all([
      ShowService.index(),
      StreamingService.index(),
    ])
    shows.value = loadedShows
    streamings.value = loadedStreamings
  } catch {
    errorMessage.value = 'Unable to load shows. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const streamingTitle = (streamingId: string) => {
  return streamings.value.find((streaming) => streaming.id === streamingId)?.title ?? 'Streaming not found'
}

const openCreateModal = () => {
  editingShowId.value = undefined
  title.value = ''
  notes.value = ''
  whereToWatch.value = ''
  isModalOpen.value = true
}

const openEditModal = (show: ShowInterface) => {
  editingShowId.value = show.id
  title.value = show.title
  notes.value = show.notes
  whereToWatch.value = show.whereToWatch
  isModalOpen.value = true
}

const closeModal = () => {
  if (!isSaving.value) isModalOpen.value = false
}

const saveShow = async () => {
  const payload = {
    title: title.value.trim(),
    notes: notes.value.trim(),
    whereToWatch: whereToWatch.value.trim(),
  }
  if (!payload.title || !payload.notes || !payload.whereToWatch || isSaving.value) return

  isSaving.value = true
  errorMessage.value = ''

  try {
    if (editingShowId.value) {
      await ShowService.update(editingShowId.value, payload)
    } else {
      await ShowService.store(payload)
    }

    closeModal()
    await loadShows()
  } catch {
    errorMessage.value = 'Unable to save this show. Please try again.'
  } finally {
    isSaving.value = false
  }
}

const deleteShow = async (show: ShowInterface) => {
  if (!show.id) return

  const result = await Swal.fire({
    title: 'Delete show?',
    text: `This will remove "${show.title}" from your watchlist.`,
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
    await ShowService.destroy(show.id)
    await loadShows()
  } catch {
    errorMessage.value = 'Unable to delete this show. Please try again.'
  }
}

onMounted(loadShows)
</script>

<template>
  <main class="min-h-[calc(100vh-155px)] bg-[#f8f7f3] px-5 py-10 sm:px-8 lg:py-16">
    <div class="mx-auto w-full flex flex-col gap-6">
      <section class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div class="flex flex-col gap-6">
          <p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d84d3b]">Watchlater library</p>
          <h1 class="font-serif text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Shows</h1>
          <p class="mt-3 max-w-xl text-slate-500">Keep the shows you want to watch close at hand.</p>
        </div>
        <PrimaryButton text="Add show" @click="openCreateModal" />
      </section>

      <p v-if="errorMessage" role="alert" class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ errorMessage }}</p>

      <section class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]" aria-labelledby="shows-heading">
        <h2 id="shows-heading" class="sr-only">Registered shows</h2>
        <div v-if="isLoading" class="px-6 py-16 text-center text-sm text-slate-500">Loading shows...</div>
        <div v-else-if="shows.length === 0" class="px-6 py-16 text-center">
          <p class="font-serif text-2xl font-bold text-slate-950">No shows yet</p>
          <p class="mt-2 text-sm text-slate-500">Add your first show to start building your watchlist.</p>
          <button type="button" class="mt-5 text-sm font-bold text-[#d84d3b] underline-offset-4 hover:underline" @click="openCreateModal">Add a show</button>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-190 text-left">
            <thead class="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th scope="col" class="px-6 py-4 font-bold">Title</th>
                <th scope="col" class="px-6 py-4 font-bold">Notes</th>
                <th scope="col" class="px-6 py-4 font-bold">Streaming</th>
                <th scope="col" class="px-6 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="show in shows" :key="show.id" class="transition-colors hover:bg-[#fffaf8]">
                <td class="px-6 py-5 font-semibold text-slate-900">{{ show.title }}</td>
                <td class="max-w-xs px-6 py-5 text-sm text-slate-500">{{ show.notes }}</td>
                <td class="px-6 py-5 text-sm text-slate-500">{{ streamingTitle(show.whereToWatch) }}</td>
                <td class="px-6 py-4">
                  <div class="flex justify-end gap-2">
                    <button type="button" class="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-200" :aria-label="`Edit ${show.title}`" @click="openEditModal(show)">Edit</button>
                    <DangerButton text="Delete" @click="deleteShow(show)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <Modal v-if="isModalOpen" :title="modalTitle()" :submit-function="saveShow" :cancel-function="closeModal">
      <form class="space-y-4" @submit.prevent="saveShow">
        <div>
          <label for="show-title" class="mb-2 block text-sm font-bold text-slate-700">Title</label>
          <input id="show-title" v-model="title" type="text" required maxlength="120" autofocus placeholder="e.g. Severance" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-[#e85d4a] focus:ring-4 focus:ring-[#e85d4a]/15" />
        </div>
        <div>
          <label for="show-notes" class="mb-2 block text-sm font-bold text-slate-700">Notes</label>
          <textarea id="show-notes" v-model="notes" required maxlength="500" rows="3" placeholder="Any additional notes about this show?" class="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-[#e85d4a] focus:ring-4 focus:ring-[#e85d4a]/15"></textarea>
        </div>
        <div>
          <label for="show-where-to-watch" class="mb-2 block text-sm font-bold text-slate-700">Where to watch</label>
          <select id="show-where-to-watch" v-model="whereToWatch" required class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#e85d4a] focus:ring-4 focus:ring-[#e85d4a]/15">
            <option value="" disabled>Select a streaming</option>
            <option v-for="streaming in streamings" :key="streaming.id" :value="streaming.id">
              {{ streaming.title }}
            </option>
          </select>
          <p v-if="streamings.length === 0" class="mt-2 text-xs text-slate-500">Register a streaming before adding a show.</p>
        </div>
      </form>
    </Modal>
  </main>
</template>