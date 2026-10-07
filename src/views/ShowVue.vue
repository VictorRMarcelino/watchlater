<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
const isModalOpen = ref(false)
const editingShowId = ref<string>()
const title = ref('')
const notes = ref('')
const whereToWatch = ref<string[]>([])
const streamingSearch = ref('')

const filteredStreamings = computed(() => {
  const search = streamingSearch.value.trim().toLowerCase()
  if (!search) return streamings.value

  return streamings.value.filter((streaming) => streaming.title.toLowerCase().includes(search))
})

const modalTitle = () => editingShowId.value ? 'Edit show' : 'New show'

const loadShows = async () => {
  isLoading.value = true

  try {
    const [loadedShows, loadedStreamings] = await Promise.all([
      ShowService.index(),
      StreamingService.index(),
    ])
    shows.value = loadedShows
    streamings.value = loadedStreamings
  } catch {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Unable to load shows. Please try again.',
    })
  } finally {
    isLoading.value = false
  }
}

const streamingTitle = (streamingIds: string[]) => {
  return streamingIds
    .map((streamingId) => streamings.value.find((streaming) => streaming.id === streamingId)?.title ?? 'Streaming not found')
    .join(', ')
}

const openCreateModal = () => {
  editingShowId.value = undefined
  title.value = ''
  notes.value = ''
  whereToWatch.value = []
  streamingSearch.value = ''
  isModalOpen.value = true
}

const openEditModal = (show: ShowInterface) => {
  editingShowId.value = show.id
  title.value = show.title
  notes.value = show.notes
  whereToWatch.value = show.whereToWatch
  streamingSearch.value = ''
  isModalOpen.value = true
}

const closeModal = () => {
  if (!isSaving.value) isModalOpen.value = false
}

const saveShow = async () => {
  const payload = {
    title: title.value.trim(),
    notes: notes.value.trim(),
    whereToWatch: whereToWatch.value,
  }
  if (!payload.title || !payload.notes || payload.whereToWatch.length === 0 || isSaving.value) return

  isSaving.value = true

  try {
    if (editingShowId.value) {
      await ShowService.update(editingShowId.value, payload)
    } else {
      await ShowService.store(payload)
    }

    closeModal()
    await loadShows()
  } catch {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Unable to save this show. Please try again.',
    })
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

  try {
    await ShowService.destroy(show.id)
    await loadShows()
  } catch {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Unable to delete this show. Please try again.',
    })
  }
}

onMounted(loadShows)
</script>

<template>
  <main class="min-h-[calc(100vh-155px)] bg-[#f8f7f3] px-5 py-10 sm:px-8 lg:py-16">
    <div class="mx-auto w-full flex flex-col gap-6">
      <section class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div class="flex flex-col gap-6">
          <p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d84d3b]">Watch Later library</p>
          <h1 class="font-serif text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Shows</h1>
          <p class="mt-3 max-w-xl text-slate-500">Keep the shows you want to watch close at hand.</p>
        </div>
        <PrimaryButton text="Add show" @click="openCreateModal" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]" aria-labelledby="shows-heading">
        <h2 id="shows-heading" class="sr-only">Registered shows</h2>
        <div v-if="isLoading" class="px-6 py-16 text-center text-sm text-slate-500">Loading shows...</div>
        <div v-else-if="shows.length === 0" class="px-6 py-16 text-center flex flex-col gap-3">
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
      <form class="space-y-4 flex flex-col gap-6" @submit.prevent="saveShow">
        <div>
          <label for="show-title" class="mb-2 block text-sm font-bold text-slate-700">Title</label>
          <input id="show-title" v-model="title" type="text" required maxlength="120" autofocus placeholder="e.g. Severance" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-[#e85d4a] focus:ring-4 focus:ring-[#e85d4a]/15" />
        </div>
        <div>
          <label for="show-notes" class="mb-2 block text-sm font-bold text-slate-700">Notes</label>
          <textarea id="show-notes" v-model="notes" required maxlength="500" rows="3" placeholder="Any additional notes about this show?" class="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-[#e85d4a] focus:ring-4 focus:ring-[#e85d4a]/15"></textarea>
        </div>
        <fieldset>
          <legend class="mb-2 text-sm font-bold text-slate-700">Where to watch</legend>
          <div v-if="streamings.length === 0" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            No streaming platforms registered. Register a streaming before adding a show.
          </div>
          <div v-else class="space-y-2">
            <input
              v-if="streamings.length > 5"
              v-model="streamingSearch"
              type="search"
              aria-label="Search streaming platforms"
              placeholder="Search platforms..."
              class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#e85d4a] focus:ring-4 focus:ring-[#e85d4a]/15"
            />
            <div class="max-h-[min(12rem,25dvh)] space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 sm:max-h-[min(16rem,30dvh)]">
              <label v-for="streaming in filteredStreamings" :key="streaming.id" class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-[#fffaf8] focus-within:ring-2 focus-within:ring-[#e85d4a]/30">
                <input v-model="whereToWatch" type="checkbox" :value="streaming.id" class="size-4 shrink-0 accent-[#d84d3b]" />
                <span>{{ streaming.title }}</span>
              </label>
              <p v-if="filteredStreamings.length === 0" class="px-3 py-3 text-sm text-slate-500">No platforms match your search.</p>
            </div>
          </div>
        </fieldset>
      </form>
    </Modal>
  </main>
</template>