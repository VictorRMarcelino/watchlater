import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  deleteUser: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  reload: vi.fn(),
  addDoc: vi.fn(),
  collection: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  updateDoc: vi.fn(),
  updateProfile: vi.fn(),
  verifyBeforeUpdateEmail: vi.fn(),
  where: vi.fn(),
  auth: { currentUser: { uid: 'current-uid', email: 'current@example.com' } },
  deleteDoc: vi.fn(),
  setAuthentication: vi.fn(),
  clearAuthentication: vi.fn(),
}))

vi.mock('@/database/Database', () => ({
  auth: mocks.auth,
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
  reload: mocks.reload,
  updateProfile: mocks.updateProfile,
  verifyBeforeUpdateEmail: mocks.verifyBeforeUpdateEmail,
}))

vi.mock('firebase/firestore', () => ({
  addDoc: mocks.addDoc,
  collection: mocks.collection,
  deleteDoc: mocks.deleteDoc,
  doc: vi.fn(),
  getDoc: mocks.getDoc,
  getDocs: mocks.getDocs,
  query: mocks.query,
  updateDoc: mocks.updateDoc,
  where: mocks.where,
}))

import UserService from '@/services/UserService'

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.currentUser.email = 'current@example.com'
    mocks.getDoc.mockResolvedValue({ data: () => ({ email: 'current@example.com' }) })
    mocks.deleteUser.mockResolvedValue(undefined)
    mocks.signOut.mockResolvedValue(undefined)
    mocks.deleteDoc.mockResolvedValue(undefined)
    mocks.addDoc.mockResolvedValue(undefined)
    mocks.collection.mockReturnValue('users-collection')
    mocks.getDocs.mockResolvedValue({ docs: [] })
    mocks.query.mockReturnValue('users-query')
    mocks.where.mockReturnValue('email-filter')
    mocks.updateDoc.mockResolvedValue(undefined)
    mocks.updateProfile.mockResolvedValue(undefined)
    mocks.verifyBeforeUpdateEmail.mockResolvedValue(undefined)
    mocks.reload.mockResolvedValue(undefined)
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

  it('loads the profile belonging to the authenticated email', async () => {
    mocks.getDocs.mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({
      docs: [{ id: 'current-user', data: () => ({ name: 'Current User', email: 'current@example.com' }) }],
    })

    await expect(UserService.getCurrentProfile()).resolves.toEqual({
      id: 'current-user',
      name: 'Current User',
      email: 'current@example.com',
    })
    expect(mocks.where).toHaveBeenCalledWith('email', '==', 'current@example.com')
  })

  it('updates the authenticated name and requests email verification before changing email', async () => {
    mocks.getDocs.mockResolvedValue({ docs: [{ id: 'current-user', data: () => ({}) }] })

    await expect(UserService.updateCurrentProfile('Updated User', 'updated@example.com'))
      .resolves.toEqual({ id: 'current-user', name: 'Updated User', email: 'current@example.com', emailVerificationPending: true })

    expect(mocks.verifyBeforeUpdateEmail).toHaveBeenCalledWith(mocks.auth.currentUser, 'updated@example.com', {
      url: 'http://localhost:3000/profile',
    })
    expect(mocks.updateProfile).toHaveBeenCalledWith(mocks.auth.currentUser, { displayName: 'Updated User' })
    expect(mocks.updateDoc).toHaveBeenCalledWith(undefined, {
      name: 'Updated User',
      uid: 'current-uid',
      pendingEmail: 'updated@example.com',
    })
  })

  it('reconciles the Firestore email after Firebase verification', async () => {
    mocks.auth.currentUser.email = 'verified@example.com'
    mocks.getDocs.mockResolvedValue({ docs: [{ id: 'current-user', data: () => ({ name: 'Current User', email: 'current@example.com', pendingEmail: 'verified@example.com' }) }] })

    await expect(UserService.getCurrentProfile()).resolves.toEqual({
      id: 'current-user',
      name: 'Current User',
      email: 'verified@example.com',
    })

    expect(mocks.updateDoc).toHaveBeenCalledWith(undefined, {
      email: 'verified@example.com',
      uid: 'current-uid',
      pendingEmail: null,
    })
  })

  it('keeps the existing email while the new address is unverified', async () => {
    mocks.getDocs.mockResolvedValue({ docs: [{
      id: 'current-user',
      data: () => ({ name: 'Current User', email: 'current@example.com', uid: 'current-uid', pendingEmail: 'new@example.com' }),
    }] })

    await expect(UserService.getCurrentProfile()).resolves.toEqual({
      id: 'current-user',
      name: 'Current User',
      email: 'current@example.com',
    })

    expect(mocks.updateDoc).not.toHaveBeenCalled()
  })

  it('deletes the authenticated Firebase user and clears the auth store', async () => {
    await expect(UserService.destroy('user-document-id')).resolves.toBe(true)

    expect(mocks.deleteUser).toHaveBeenCalledWith(mocks.auth.currentUser)
    expect(mocks.deleteDoc).toHaveBeenCalled()
    expect(mocks.signOut).toHaveBeenCalled()
    expect(mocks.clearAuthentication).toHaveBeenCalled()
  })
})