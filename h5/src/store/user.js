// src/store/user.js
import { defineStore } from 'pinia';
import Api from '@/api';
import { secureStorage } from '@/utils/secure-storage';
import { KEYS } from '@/constants/keys';
import { normalizeUser } from '@/utils/normalize-user';

const isObject = (val) => val && typeof val === 'object' && !Array.isArray(val);

const transformBtnAuths = (data = {}) => {
  const result = {};
  Object.keys(data).forEach((key) => {
    const item = data[key] || {};
    result[key] = {
      name: item.name,
      btnType: item.btnType,
      dataPromissionType: item.dataPromissionType,
      dataPromissionDeptType: item.dataPromissionDeptType,
    };
  });
  return result;
};

const flattenPermissionCodes = (list = [], result = []) => {
  list.forEach((item) => {
    if (typeof item !== 'object' || item === null) return;
    const children = item.children;
    const code = item.code;
    if (Array.isArray(children) && children.length > 0) {
      flattenPermissionCodes(children, result);
    } else if (code) {
      result.push(code);
    }
  });
  return result;
};

function readLoginInfo() {
  if (typeof window === 'undefined' || !window?.localStorage) return null;
  try {
    const stored = window.localStorage.getItem(KEYS.LOGIN_INFO);
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.warn('[user-store] failed to read login info:', err);
    return null;
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
    setUserInfo(info) {
      this.userInfo = info;
      if (info) secureStorage.set(KEYS.USER_INFO, info);
      else secureStorage.remove(KEYS.USER_INFO);
    },

    setLoginInfo(info) {
      if (typeof window === 'undefined' || !window?.localStorage) {
        this.loginInfo = info || null;
        return;
      }

      if (isObject(info)) {
        this.loginInfo = info;
        try {
          window.localStorage.setItem(KEYS.LOGIN_INFO, JSON.stringify(info));
        } catch (err) {
          console.warn('[user-store] failed to persist login info:', err);
          try {
            window.localStorage.setItem(KEYS.LOGIN_INFO, String(info));
          } catch {}
        }
      } else {
        this.loginInfo = null;
        try {
          window.localStorage.removeItem(KEYS.LOGIN_INFO);
        } catch (err) {
          console.warn('[user-store] failed to remove login info:', err);
        }
      }
    },

    mergeLoginInfo(loginInfo) {
      if (!isObject(loginInfo)) {
        this.setLoginInfo(null);
        return;
      }

      const mergedLoginInfo = {
        ...(this.loginInfo || {}),
        ...loginInfo,
      };
      this.setLoginInfo(mergedLoginInfo);

      const mergedUser = {
        ...(this.userInfo || {}),
        ...loginInfo,
        dept_name: this.userInfo?.deptName.toString() || '',
        post_name: this.userInfo?.postNames.toString() || '',
      };

      this.setUserInfo(mergedUser);
    },

    setBtnPermission(permission) {
      this.btnPermission = permission || {};
    },

    setPermission(permission) {
      const codes = flattenPermissionCodes(permission || []);
      const map = {};
      codes.forEach((code) => {
        map[code] = true;
      });
      this.permission = map;
      secureStorage.set(KEYS.PERMISSION, this.permission);
    },

    setDeptInfo(deptInfo) {
      this.deptInfo = deptInfo || null;
      if (this.deptInfo) {
        secureStorage.set(KEYS.DEPT_INFO, this.deptInfo);
      } else {
        secureStorage.remove(KEYS.DEPT_INFO);
      }
    },

    reset() {
      this.setUserInfo(null);
      this.setLoginInfo(null);
      this.permission = {};
      this.btnPermission = {};
      this.deptInfo = null;
      secureStorage.remove(KEYS.PERMISSION);
      secureStorage.remove(KEYS.DEPT_INFO);
    },

    // 拉取接口：你的返回是 { code, success, data, msg }
    async fetchUserInfo() {
      const res = await Api.user.getUserInfo();
      const raw = res?.data?.data || res?.data || {};
      const normalized = normalizeUser(raw || {});
      this.setUserInfo(normalized);
      await this.refreshPermissionData();
      return normalized;
    },

    async changePassword(payload = {}) {
      const params = {
        oldPassword: payload.oldPassword,
        newPassword: payload.newPassword,
      };

      await Api.user.updatePassword(params);
    },

    async fetchBtnPermissions() {
      try {
        const res = await Api.user.getDataPermissionButtons();
        if (res.data?.code === 200) {
          this.setBtnPermission(transformBtnAuths(res.data?.data?.menu || {}));
        }
      } catch (error) {
        console.error('获取数据级，按钮权限 数据失败', error);
      }
    },

    async fetchButtons() {
      const res = await Api.user.getButtons();
      const data = res.data?.data || [];
      this.setPermission(data);
    },

    async refreshPermissionData() {
      await Promise.allSettled([this.fetchButtons(), this.fetchBtnPermissions()]);
    },
  },
});
