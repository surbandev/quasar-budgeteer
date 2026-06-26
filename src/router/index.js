import { watch } from 'vue'
import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import { useAuthStore } from 'stores/auth'
import routes from './routes'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // Navigation guard for authentication
  Router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    if (!authStore.authChecked) {
      await new Promise((resolve) => {
        const stop = watch(
          () => authStore.authChecked,
          (checked) => {
            if (checked) {
              stop()
              resolve()
            }
          },
          { immediate: true },
        )
      })
    }

    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin)

    if (requiresAuth && !authStore.isAuthenticated) {
      next('/login')
    } else if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
      next('/overview')
    } else if (requiresAdmin) {
      if (!authStore.currentUser && authStore.getUserID) {
        try {
          await authStore.fetchUser(authStore.getUserID)
        } catch {
          next('/tools')
          return
        }
      }
      if (!authStore.isAdmin) {
        next('/tools')
      } else {
        next()
      }
    } else {
      next()
    }
  })

  return Router
})
