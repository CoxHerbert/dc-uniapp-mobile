import { defineStore } from 'pinia'
import { KEYS } from '@/constants/keys'
import { extractLoginInfo, type LoginInfo } from '@/utils/login-info'

const readStorage = <T>(key: string, fallback: T): T => {
  try {
    const value = uni.getStorageSync(key)
    return (value as T) || fallback
  } catch {
    return fallback
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: readStorage<Record<string, any> | null>(KEYS.USER_INFO, null),
    loginInfo: readStorage<LoginInfo | null>(KEYS.LOGIN_INFO, null),
  }),

  actions: {
    setUserInfo(info: Record<string, any> | null) {
      this.userInfo = info
      try {
        if (info) {
          uni.setStorageSync(KEYS.USER_INFO, info)
        } else {
          uni.removeStorageSync(KEYS.USER_INFO)
        }
      } catch (error) {
        console.warn('[user-store] user info persistence failed:', error)
      }
    },

    setLoginInfo(info: LoginInfo | null) {
      this.loginInfo = info
      try {
        if (info) {
          uni.setStorageSync(KEYS.LOGIN_INFO, info)
        } else {
          uni.removeStorageSync(KEYS.LOGIN_INFO)
        }
      } catch (error) {
        console.warn('[user-store] login info persistence failed:', error)
      }
    },

    mergeLoginInfo(info: LoginInfo | null) {
      if (!info) {
        this.setLoginInfo(null)
        return
      }

      const merged = {
        ...(this.loginInfo || {}),
        ...info,
      }
      this.setLoginInfo(merged)
      if (info.user) {
        this.setUserInfo(info.user)
      }
    },

    updateFromPayload(payload: any) {
      const loginInfo = extractLoginInfo(payload)
      this.mergeLoginInfo(loginInfo)
      if (payload?.user) {
        this.setUserInfo(payload.user)
      }
    },

    reset() {
      this.setUserInfo(null)
      this.setLoginInfo(null)
    },
  },
})
