import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  deleteUser: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  reload: vi.fn(),
  collection: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn((_database, ...path: string[]) => path.join('/')),
  updateProfile: vi.fn(),
  verifyBeforeUpdateEmail: vi.fn(),
  where: vi.fn(),
  auth: {
    currentUser: {
      uid: 'current-uid',
      email: 'current@example.com',
      getIdToken: vi.fn().mockResolvedValue('auth-token'),
    },
  },
  deleteDoc: vi.fn(),
  setAuthentication: vi.fn(),
  setAdminStatus: vi.fn(),
  clearAuthentication: vi.fn(),
}))

vi.mock('@/database/Database', () => ({
  auth: mocks.auth,
  default: {},
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    setAuthentication: mocks.setAuthentication,
    setAdminStatus: mocks.setAdminStatus,
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
  collection: mocks.collection,
  deleteDoc: mocks.deleteDoc,
  doc: mocks.doc,
  getDoc: mocks.getDoc,
  getDocs: mocks.getDocs,
  query: mocks.query,
  setDoc: mocks.setDoc,
  updateDoc: mocks.updateDoc,
  where: mocks.where,
}))

import UserService from '@/services/UserService'

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.currentUser.email = 'current@example.com'
    mocks.getDoc.mockResolvedValue({ data: () => undefined })
    mocks.deleteUser.mockResolvedValue(undefined)
    mocks.signOut.mockResolvedValue(undefined)
    mocks.deleteDoc.mockResolvedValue(undefined)
    mocks.collection.mockReturnValue('users-collection')
    mocks.getDocs.mockResolvedValue({ docs: [] })
    mocks.query.mockReturnValue('users-query')
    mocks.where.mockReturnValue('email-filter')
    mocks.updateDoc.mockResolvedValue(undefined)
    mocks.setDoc.mockResolvedValue(undefined)
    mocks.updateProfile.mockResolvedValue(undefined)
    mocks.verifyBeforeUpdateEmail.mockResolvedValue(undefined)
    mocks.reload.mockResolvedValue(undefined)
  })

  it('stores the new user profile under its Firebase UID with a non-admin flag', async () => {
    const firebaseUser = {
      uid: 'new-user-uid',
      email: 'new@example.com',
      getIdToken: vi.fn().mockResolvedValue('auth-token'),
    }
    mocks.createUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUser })

    await expect(UserService.register('New User', 'new@example.com', 'password'))
      .resolves.toBe(firebaseUser)

    expect(mocks.doc).toHaveBeenCalledWith({}, 'users', 'new-user-uid')
    expect(mocks.setDoc).toHaveBeenCalledWith('users/new-user-uid', {
      uid: 'new-user-uid',
      name: 'New User',
      email: 'new@example.com',
      admin: false,
    })
    expect(mocks.setAuthentication).toHaveBeenCalledWith(firebaseUser, 'auth-token', false)
  })

  it('grants the initial administrator from the user profile field', async () => {
    const firebaseUser = {
      uid: 'initial-admin-uid',
      email: 'victorrasmarcelino@gmail.com',
      getIdToken: vi.fn().mockResolvedValue('auth-token'),
    }
    mocks.createUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUser })

    await UserService.register('Initial Admin', firebaseUser.email, 'password')

    expect(mocks.setDoc).toHaveBeenCalledWith('users/initial-admin-uid', expect.objectContaining({
      uid: 'initial-admin-uid',
      admin: true,
    }))
    expect(mocks.setAuthentication).toHaveBeenCalledWith(firebaseUser, 'auth-token', true)
  })

  it('deletes the newly created auth account if saving its profile fails', async () => {
    const firebaseUser = {
      uid: 'new-user-uid',
      email: 'new@example.com',
      getIdToken: vi.fn().mockResolvedValue('auth-token'),
    }
    const firestoreError = Object.assign(new Error('Permission denied'), { code: 'permission-denied' })
    mocks.createUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUser })
    mocks.setDoc.mockRejectedValue(firestoreError)

    await expect(UserService.register('New User', 'new@example.com', 'password'))
      .rejects.toBe(firestoreError)

    expect(mocks.deleteUser).toHaveBeenCalledWith(firebaseUser)
    expect(mocks.setAuthentication).not.toHaveBeenCalled()
  })

  it.each([true, false])('loads the admin flag from the user profile (%s)', async (admin) => {
    const firebaseUser = {
      uid: 'user-uid',
      email: 'person@example.com',
      getIdToken: vi.fn().mockResolvedValue('auth-token'),
    }
    mocks.signInWithEmailAndPassword.mockResolvedValue({ user: firebaseUser })
    mocks.getDoc.mockResolvedValue({
      data: () => ({ uid: 'user-uid', name: 'Person', email: 'person@example.com', admin }),
    })

    await expect(UserService.login('person@example.com', 'password')).resolves.toBe(firebaseUser)

    expect(firebaseUser.getIdToken).toHaveBeenCalledOnce()
    expect(mocks.getDocs).not.toHaveBeenCalled()
    expect(mocks.setAuthentication).toHaveBeenCalledWith(firebaseUser, 'auth-token', admin)
  })

  it('returns the persisted administrator field in user profiles', async () => {
    mocks.getDocs.mockResolvedValue({
      docs: [{
        id: 'user-id',
        data: () => ({ uid: 'user-uid', name: 'User', email: 'user@example.com', admin: true }),
      }],
    })

    await expect(UserService.index()).resolves.toEqual([{
      id: 'user-id',
      uid: 'user-uid',
      name: 'User',
      email: 'user@example.com',
      admin: true,
    }])
  })

  it('loads the profile belonging to the authenticated email', async () => {
    mocks.getDoc.mockResolvedValue({
      data: () => ({ uid: 'current-uid', name: 'Current User', email: 'current@example.com', admin: false }),
    })

    await expect(UserService.getCurrentProfile()).resolves.toEqual({
      id: 'current-uid',
      name: 'Current User',
      email: 'current@example.com',
    })
    expect(mocks.doc).toHaveBeenCalledWith({}, 'users', 'current-uid')
  })

  it('updates the authenticated name and requests email verification before changing email', async () => {
    mocks.getDoc.mockResolvedValue({
      data: () => ({ uid: 'current-uid', name: 'Current User', email: 'current@example.com', admin: false }),
    })

    await expect(UserService.updateCurrentProfile('Updated User', 'updated@example.com'))
      .resolves.toEqual({ id: 'current-uid', name: 'Updated User', email: 'current@example.com', emailVerificationPending: true })

    expect(mocks.verifyBeforeUpdateEmail).toHaveBeenCalledWith(mocks.auth.currentUser, 'updated@example.com', {
      url: 'http://localhost:3000/profile',
    })
    expect(mocks.updateProfile).toHaveBeenCalledWith(mocks.auth.currentUser, { displayName: 'Updated User' })
    expect(mocks.updateDoc).toHaveBeenCalledWith('users/current-uid', {
      name: 'Updated User',
      pendingEmail: 'updated@example.com',
    })
  })

  it('does not save the profile when Firebase reports the new email is already in use', async () => {
    mocks.getDoc.mockResolvedValue({
      data: () => ({ uid: 'current-uid', name: 'Current User', email: 'current@example.com', admin: false }),
    })
    mocks.verifyBeforeUpdateEmail.mockRejectedValue(
      Object.assign(new Error('Email already in use'), { code: 'auth/email-already-in-use' })
    )

    await expect(UserService.updateCurrentProfile('Updated User', 'updated@example.com'))
      .rejects.toMatchObject({ code: 'auth/email-already-in-use' })

    expect(mocks.updateProfile).not.toHaveBeenCalled()
    expect(mocks.updateDoc).not.toHaveBeenCalled()
  })

  it('updates the administrator flag in Firestore and refreshes current auth state', async () => {
    await UserService.setAdmin('current-uid', true)

    expect(mocks.updateDoc).toHaveBeenCalledWith('users/current-uid', { admin: true })
    expect(mocks.setAdminStatus).toHaveBeenCalledWith(true)
  })

  it('rejects an email already used by another user before updating a profile', async () => {
    mocks.getDocs.mockResolvedValue({
      docs: [{ id: 'other-user', data: () => ({ email: 'UPDATED@example.com' }) }],
    })

    await expect(UserService.update('user-id', { email: 'updated@example.com' }))
      .rejects.toMatchObject({ code: 'auth/email-already-in-use' })

    expect(mocks.updateDoc).not.toHaveBeenCalled()
  })

  it('reconciles the Firestore email after Firebase verification', async () => {
    mocks.auth.currentUser.email = 'verified@example.com'
    mocks.getDoc.mockResolvedValue({
      data: () => ({ uid: 'current-uid', name: 'Current User', email: 'current@example.com', pendingEmail: 'verified@example.com' }),
    })

    await expect(UserService.getCurrentProfile()).resolves.toEqual({
      id: 'current-uid',
      name: 'Current User',
      email: 'verified@example.com',
    })

    expect(mocks.updateDoc).toHaveBeenCalledWith('users/current-uid', {
      email: 'verified@example.com',
      pendingEmail: null,
    })
  })

  it('keeps the existing email while the new address is unverified', async () => {
    mocks.getDoc.mockResolvedValue({
      data: () => ({ name: 'Current User', email: 'current@example.com', uid: 'current-uid', pendingEmail: 'new@example.com', admin: false }),
    })

    await expect(UserService.getCurrentProfile()).resolves.toEqual({
      id: 'current-uid',
      name: 'Current User',
      email: 'current@example.com',
    })

    expect(mocks.updateDoc).not.toHaveBeenCalled()
  })

  it('deletes the authenticated Firebase user and clears the auth store', async () => {
    mocks.getDoc.mockResolvedValue({
      data: () => ({ uid: 'current-uid', email: 'current@example.com' }),
    })

    await expect(UserService.destroy('user-document-id')).resolves.toBe(true)

    expect(mocks.deleteUser).toHaveBeenCalledWith(mocks.auth.currentUser)
    expect(mocks.deleteDoc).toHaveBeenCalled()
    expect(mocks.signOut).toHaveBeenCalled()
    expect(mocks.clearAuthentication).toHaveBeenCalled()
  })

  it('migrates a legacy profile to a document keyed by Firebase UID', async () => {
    mocks.getDoc.mockResolvedValue({ data: () => undefined })
    mocks.getDocs
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({
        docs: [{
          id: 'legacy-document',
          data: () => ({ name: 'Legacy User', email: 'current@example.com', admin: true }),
        }],
      })

    await expect(UserService.getUserProfile({
      uid: 'current-uid',
      email: 'current@example.com',
    } as import('firebase/auth').User)).resolves.toEqual({
      id: 'current-uid',
      uid: 'current-uid',
      name: 'Legacy User',
      email: 'current@example.com',
      admin: false,
    })

    expect(mocks.setDoc).toHaveBeenCalledWith('users/current-uid', {
      uid: 'current-uid',
      name: 'Legacy User',
      email: 'current@example.com',
      admin: false,
    })
    expect(mocks.deleteDoc).toHaveBeenCalledWith('users/legacy-document')
  })
})