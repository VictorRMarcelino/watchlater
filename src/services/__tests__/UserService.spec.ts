import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  deleteUser: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  addDoc: vi.fn(),
  collection: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  deleteDoc: vi.fn(),
  setAuthentication: vi.fn(),
  clearAuthentication: vi.fn(),
}))

vi.mock('@/database/Database', () => ({
  auth: { currentUser: { email: 'current@example.com' } },
  default: {},
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    setAuthentication: mocks.setAuthentication,
    clearAuthentication: mocks.clearAuthentication,
  }),
}))

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: mocks.createUserWithEmailAndPassword,
  deleteUser: mocks.deleteUser,
  signInWithEmailAndPassword: mocks.signInWithEmailAndPassword,
  signOut: mocks.signOut,
}))

vi.mock('firebase/firestore', () => ({
  addDoc: mocks.addDoc,
  collection: mocks.collection,
  deleteDoc: mocks.deleteDoc,
  doc: vi.fn(),
  getDoc: mocks.getDoc,
  getDocs: mocks.getDocs,
  updateDoc: vi.fn(),
}))

import UserService from '@/services/UserService'

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getDoc.mockResolvedValue({ data: () => ({ email: 'current@example.com' }) })
    mocks.deleteUser.mockResolvedValue(undefined)
    mocks.signOut.mockResolvedValue(undefined)
    mocks.deleteDoc.mockResolvedValue(undefined)
    mocks.addDoc.mockResolvedValue(undefined)
    mocks.collection.mockReturnValue('users-collection')
    mocks.getDocs.mockResolvedValue({ docs: [] })
  })

  it('stores the new user profile in Firestore without an admin field', async () => {
    const firebaseUser = {
      email: 'new@example.com',
      getIdTokenResult: vi.fn().mockResolvedValue({ token: 'auth-token', claims: {} }),
    }
    mocks.createUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUser })

    await expect(UserService.register('New User', 'new@example.com', 'password'))
      .resolves.toBe(firebaseUser)

    expect(mocks.collection).toHaveBeenCalledWith({}, 'users')
    expect(mocks.addDoc).toHaveBeenCalledWith('users-collection', {
      name: 'New User',
      email: 'new@example.com',
    })
    expect(mocks.setAuthentication).toHaveBeenCalledWith(firebaseUser, 'auth-token', false)
  })

  it('deletes the newly created auth account if saving its profile fails', async () => {
    const firebaseUser = {
      email: 'new@example.com',
      getIdTokenResult: vi.fn().mockResolvedValue({ token: 'auth-token', claims: {} }),
    }
    const firestoreError = Object.assign(new Error('Permission denied'), { code: 'permission-denied' })
    mocks.createUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUser })
    mocks.addDoc.mockRejectedValue(firestoreError)

    await expect(UserService.register('New User', 'new@example.com', 'password'))
      .rejects.toBe(firestoreError)

    expect(mocks.deleteUser).toHaveBeenCalledWith(firebaseUser)
    expect(mocks.setAuthentication).not.toHaveBeenCalled()
  })

  it.each([true, false])('loads the custom admin claim (%s)', async (admin) => {
    const firebaseUser = {
      email: 'person@example.com',
      getIdTokenResult: vi.fn().mockResolvedValue({ token: 'auth-token', claims: { admin } }),
    }
    mocks.signInWithEmailAndPassword.mockResolvedValue({ user: firebaseUser })

    await expect(UserService.login('person@example.com', 'password')).resolves.toBe(firebaseUser)

    expect(firebaseUser.getIdTokenResult).toHaveBeenCalledWith(true)
    expect(mocks.getDocs).not.toHaveBeenCalled()
    expect(mocks.setAuthentication).toHaveBeenCalledWith(firebaseUser, 'auth-token', admin)
  })

  it('does not expose a legacy Firestore admin field in user profiles', async () => {
    mocks.getDocs.mockResolvedValue({
      docs: [{
        id: 'user-id',
        data: () => ({ name: 'User', email: 'user@example.com', admin: true }),
      }],
    })

    await expect(UserService.index()).resolves.toEqual([{
      id: 'user-id',
      name: 'User',
      email: 'user@example.com',
      password: undefined,
    }])
  })

  it('deletes the authenticated Firebase user and clears the auth store', async () => {
    await expect(UserService.destroy('user-document-id')).resolves.toBe(true)

    expect(mocks.deleteUser).toHaveBeenCalledWith({ email: 'current@example.com' })
    expect(mocks.deleteDoc).toHaveBeenCalled()
    expect(mocks.signOut).toHaveBeenCalled()
    expect(mocks.clearAuthentication).toHaveBeenCalled()
  })
})