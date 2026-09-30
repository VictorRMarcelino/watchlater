import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
}))

vi.mock('@/database/Database', () => ({ default: {} }))

vi.mock('firebase/firestore', () => ({
  addDoc: mocks.addDoc,
  collection: mocks.collection,
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDocs: mocks.getDocs,
  updateDoc: vi.fn(),
}))

import ShowService from '@/services/ShowService'

describe('ShowService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.collection.mockReturnValue('shows-collection')
    mocks.addDoc.mockResolvedValue(undefined)
  })

  it('returns streaming IDs as arrays for both legacy and current shows', async () => {
    mocks.getDocs.mockResolvedValue({
      docs: [
        { id: 'legacy-show', data: () => ({ title: 'Legacy', notes: '', whereToWatch: 'streaming-a' }) },
        { id: 'current-show', data: () => ({ title: 'Current', notes: '', whereToWatch: ['streaming-a', 'streaming-b'] }) },
      ],
    })

    await expect(ShowService.index()).resolves.toEqual([
      { id: 'legacy-show', title: 'Legacy', notes: '', whereToWatch: ['streaming-a'] },
      { id: 'current-show', title: 'Current', notes: '', whereToWatch: ['streaming-a', 'streaming-b'] },
    ])
  })

  it('stores all selected streaming IDs', async () => {
    const show = { title: 'Current', notes: '', whereToWatch: ['streaming-a', 'streaming-b'] }

    await ShowService.store(show)

    expect(mocks.addDoc).toHaveBeenCalledWith('shows-collection', show)
  })
})