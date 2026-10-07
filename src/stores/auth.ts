import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<User | null>(null)
  const isAdmin = ref(false)

  function setAuthentication(authenticatedUser: User, authenticationToken: string, admin = false) {
    user.value = authenticatedUser
    token.value = authenticationToken
    isAdmin.value = admin
  }

  function setAdminStatus(admin: boolean) {
    isAdmin.value = admin
  }

  function clearAuthentication() {
    user.value = null
    token.value = null
    isAdmin.value = false
  }

  return { token, user, isAdmin, setAuthentication, setAdminStatus, clearAuthentication }
})