import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  deleteUser: vi.fn(),
  signOut: vi.fn(),
  getDoc: vi.fn(),
  deleteDoc: vi.fn(),
  clearAuthentication: vi.fn(),
}))

vi.mock('@/database/Database', () => ({
  auth: { currentUser: { email: 'current@example.com' } },
  default: {},
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ clearAuthentication: mocks.clearAuthentication }),
}))

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  deleteUser: mocks.deleteUser,
  signInWithEmailAndPassword: vi.fn(),
  signOut: mocks.signOut,
}))

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  deleteDoc: mocks.deleteDoc,
  doc: vi.fn(),
  getDoc: mocks.getDoc,
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
}))

import UserService from '@/services/UserService'

describe('UserService.destroy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getDoc.mockResolvedValue({ data: () => ({ email: 'current@example.com' }) })
    mocks.deleteUser.mockResolvedValue(undefined)
    mocks.signOut.mockResolvedValue(undefined)
    mocks.deleteDoc.mockResolvedValue(undefined)
  })

  it('deletes the authenticated Firebase user and clears the auth store', async () => {
    await expect(UserService.destroy('user-document-id')).resolves.toBe(true)

    expect(mocks.deleteUser).toHaveBeenCalledWith({ email: 'current@example.com' })
    expect(mocks.deleteDoc).toHaveBeenCalled()
    expect(mocks.signOut).toHaveBeenCalled()
    expect(mocks.clearAuthentication).toHaveBeenCalled()
  })
})