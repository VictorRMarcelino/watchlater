import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'streamings',
      meta: { requiresAuth: true, requiresAdmin: true },
      component: () => import('../views/StreamingVue.vue'),
    },
    {
      path: '/shows',
      name: 'shows',
      meta: { requiresAuth: true },
      component: () => import('../views/ShowVue.vue'),
    },
    {
      path: '/users',
      name: 'users',
      meta: { requiresAuth: true, requiresAdmin: true },
      component: () => import('../views/UserVue.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginVue.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterVue.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { name: 'shows' }
  }

  if ((to.name === 'login' || to.name === 'register') && authStore.token) {
    return { name: 'streamings' }
  }
})

export default router
