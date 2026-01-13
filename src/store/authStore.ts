import { defineStore } from 'pinia'
import Apis from '@/api'
import { KEYS } from '@/constants/keys'
import { useUserStore } from './userStore'

const readToken = () => {
  try {
    return uni.getStorageSync(KEYS.ACCESS_TOKEN) || ''
  } catch {
    return ''
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: readToken(),
  }),

  getters: {
    isLogin: state => Boolean(state.token),
  },

  actions: {
    setToken(token?: string) {
      this.token = token || ''
      try {
        if (token) {
          uni.setStorageSync(KEYS.ACCESS_TOKEN, token)
        } else {
          uni.removeStorageSync(KEYS.ACCESS_TOKEN)
        }
      } catch (error) {
        console.warn('[auth-store] token persistence failed:', error)
      }
    },

    logout() {
      this.setToken('')
      const userStore = useUserStore()
      userStore.reset()
    },

    async loginByUsername(form: { username: string; password: string }) {
      const res = await Apis.user.loginUser({
        username: form.username,
        password: form.password,
      })

      const payload = (res as any)?.data?.data || (res as any)?.data || res
      const token = payload?.token || payload?.access_token || payload?.accessToken
      if (token) {
        this.setToken(token)
      }
      return payload
    },
  },
})
