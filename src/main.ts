import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { onAuthStateChanged } from 'firebase/auth'

import App from './App.vue'
import router from './router'
import { auth } from './database/Database'
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
				const tokenResult = await user.getIdTokenResult()
				authStore.setAuthentication(user, tokenResult.token, tokenResult.claims.admin === true)
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
