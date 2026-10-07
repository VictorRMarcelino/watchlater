import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { onAuthStateChanged } from 'firebase/auth'

import App from './App.vue'
import router from './router'
import { auth } from './database/Database'
import UserService from './services/UserService'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const authStore = useAuthStore(pinia)
await new Promise<void>((resolve) => {
	let hasInitialized = false

	onAuthStateChanged(auth, async (user) => {
		try {
			if (user) {
				const profile = await UserService.getUserProfile(user)
				const token = await user.getIdToken()
				authStore.setAuthentication(user, token, profile.admin)
			} else {
				authStore.clearAuthentication()
			}
		} catch {
			authStore.clearAuthentication()
		}

		if (!hasInitialized) {
			hasInitialized = true
			resolve()
		}
	})
})

app.use(router)

app.mount('#app')
