import { defineStore } from 'pinia'
import Api from '@/api/h5'
import { KEYS } from '@/constants/keys'
import { secureStorage } from '@/utils/secure-storage'
import { normalizeUser } from '@/utils/normalize-user'

const isObject = (value: unknown) => value && typeof value === 'object' && !Array.isArray(value)

const plainStorage = {
  getItem(key: string) {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key)
    }
    if (typeof uni !== 'undefined' && typeof uni.getStorageSync === 'function') {
      const value = uni.getStorageSync(key)
      return typeof value === 'string' ? value : JSON.stringify(value)
    }
    return null
  },
  setItem(key: string, value: string) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value)
      return
    }
    if (typeof uni !== 'undefined' && typeof uni.setStorageSync === 'function') {
      uni.setStorageSync(key, value)
    }
  },
  removeItem(key: string) {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key)
      return
    }
    if (typeof uni !== 'undefined' && typeof uni.removeStorageSync === 'function') {
      uni.removeStorageSync(key)
    }
  },
}

const transformBtnAuths = (data: Record<string, any> = {}) => {
  const result: Record<string, any> = {}
  Object.keys(data).forEach((key) => {
    const item = data[key] || {}
    result[key] = {
      name: item.name,
      btnType: item.btnType,
      dataPromissionType: item.dataPromissionType,
      dataPromissionDeptType: item.dataPromissionDeptType,
    }
  })
  return result
}

const flattenPermissionCodes = (list: any[] = [], result: string[] = []) => {
  list.forEach((item) => {
    if (typeof item !== 'object' || item === null) return
    const children = item.children
    const code = item.code
    if (Array.isArray(children) && children.length > 0) {
      flattenPermissionCodes(children, result)
    }
    else if (code) {
      result.push(code)
    }
  })
  return result
}

function readLoginInfo() {
  try {
    const stored = plainStorage.getItem(KEYS.LOGIN_INFO)
    return stored ? JSON.parse(stored) : null
  }
  catch (error) {
    console.warn('[user-store] failed to read login info:', error)
    return null
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: secureStorage.get(KEYS.USER_INFO, null),
    loginInfo: readLoginInfo(),
    permission: secureStorage.get(KEYS.PERMISSION, {}),
    btnPermission: {},
    deptInfo: secureStorage.get(KEYS.DEPT_INFO, null),
  }),

  actions: {
    setUserInfo(info: any) {
      this.userInfo = info
      if (info) secureStorage.set(KEYS.USER_INFO, info)
      else secureStorage.remove(KEYS.USER_INFO)
    },

    setLoginInfo(info: any) {
      if (isObject(info)) {
        this.loginInfo = info
        try {
          plainStorage.setItem(KEYS.LOGIN_INFO, JSON.stringify(info))
        }
        catch (error) {
          console.warn('[user-store] failed to persist login info:', error)
        }
      }
      else {
        this.loginInfo = null
        try {
          plainStorage.removeItem(KEYS.LOGIN_INFO)
        }
        catch (error) {
          console.warn('[user-store] failed to remove login info:', error)
        }
      }
    },

    mergeLoginInfo(loginInfo: any) {
      if (!isObject(loginInfo)) {
        this.setLoginInfo(null)
        return
      }

      const mergedLoginInfo = {
        ...(this.loginInfo || {}),
        ...loginInfo,
      }
      this.setLoginInfo(mergedLoginInfo)

      const mergedUser = {
        ...(this.userInfo || {}),
        ...loginInfo,
        dept_name: this.userInfo?.deptName?.toString() || '',
        post_name: this.userInfo?.postNames?.toString() || '',
      }

      this.setUserInfo(mergedUser)
    },

    setBtnPermission(permission: Record<string, any>) {
      this.btnPermission = permission || {}
    },

    setPermission(permission: any[]) {
      const codes = flattenPermissionCodes(permission || [])
      const map: Record<string, boolean> = {}
      codes.forEach((code) => {
        map[code] = true
      })
      this.permission = map
      secureStorage.set(KEYS.PERMISSION, this.permission)
    },

    setDeptInfo(deptInfo: any) {
      this.deptInfo = deptInfo || null
      if (this.deptInfo) {
        secureStorage.set(KEYS.DEPT_INFO, this.deptInfo)
      }
      else {
        secureStorage.remove(KEYS.DEPT_INFO)
      }
    },

    reset() {
      this.setUserInfo(null)
      this.setLoginInfo(null)
      this.permission = {}
      this.btnPermission = {}
      this.deptInfo = null
      secureStorage.remove(KEYS.PERMISSION)
      secureStorage.remove(KEYS.DEPT_INFO)
    },

    async fetchUserInfo() {
      const res = await Api.user.getUserInfo()
      const raw = (res as any)?.data?.data || (res as any)?.data || {}
      const normalized = normalizeUser(raw || {})
      this.setUserInfo(normalized)
      await this.refreshPermissionData()
      return normalized
    },

    async changePassword(payload: Record<string, any> = {}) {
      const params = {
        oldPassword: payload.oldPassword,
        newPassword: payload.newPassword,
      }

      await Api.user.updatePassword(params)
    },

    async fetchBtnPermissions() {
      try {
        const res = await Api.user.getDataPermissionButtons()
        const data = (res as any)?.data
        if (data?.code === 200) {
          this.setBtnPermission(transformBtnAuths(data?.data?.menu || {}))
        }
      }
      catch (error) {
        console.error('获取数据级，按钮权限 数据失败', error)
      }
    },

    async fetchButtons() {
      const res = await Api.user.getButtons()
      const data = (res as any)?.data?.data || []
      this.setPermission(data)
    },

    async refreshPermissionData() {
      await Promise.allSettled([this.fetchButtons(), this.fetchBtnPermissions()])
    },
  },
})
