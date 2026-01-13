/// <reference types="@uni-helper/vite-plugin-uni-pages/client" />
import { pages, subPackages } from 'virtual:uni-pages'
import { useUserStore } from '@/store/user'

function generateRoutes() {
  const routes = pages.map((page) => {
    const newPath = `/${page.path}`
    return { ...page, path: newPath }
  })
  if (subPackages && subPackages.length > 0) {
    subPackages.forEach((subPackage) => {
      const subRoutes = subPackage.pages.map((page: any) => {
        const newPath = `/${subPackage.root}/${page.path}`
        return { ...page, path: newPath }
      })
      routes.push(...subRoutes)
    })
  }
  return routes
}

const router = createRouter({
  routes: generateRoutes(),
})

const isLoginPath = (path?: string) => !!path && path.startsWith('/pages/login')

router.beforeEach((to, _from, next) => {
  const requiresAuth = to.meta?.requiresAuth !== false
  if (!requiresAuth) return next()

  if (isLoginPath(to.path)) return next()

  const userStore = useUserStore()
  if (userStore.userInfo) return next()

  return next({
    name: 'LOGIN_ACCOUNT',
    query: {
      redirect: to.path || '/',
    },
  })
})

export default router
