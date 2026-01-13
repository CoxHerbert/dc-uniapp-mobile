import { defineStore } from 'pinia';
import {
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
} from '@/utils/auth';
import Api from '@/api';
import { encrypt } from '@/utils/sm2';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken() || null,
    refreshToken: getRefreshToken() || null,
    _refreshingPromise: null,
  }),

  getters: {
    isLogin: (s) => !!s.token,
  },

  actions: {
    setTokenPair({ accessToken, refreshToken }) {
      if (accessToken) {
        this.token = accessToken;
        setToken(accessToken);
      }
      if (refreshToken) {
        this.refreshToken = refreshToken;
        setRefreshToken(refreshToken);
      }
    },

    clearToken() {
      this.token = null;
      removeToken();
    },
    clearRefreshToken() {
      this.refreshToken = null;
      removeRefreshToken();
    },

    logout() {
      this.clearToken();
      this.clearRefreshToken();
      try {
        const { useUserStore } = require('./user');
        useUserStore().reset();
      } catch {
        // ignore
      }
      this._refreshingPromise = null;
    },

    async loginByUsername(form) {
      const password = encrypt(form.password);
      const res = await Api.auth.loginByUsername(
        form.tenantId,
        form.deptId,
        form.roleId,
        form.username,
        password,
        form.type,
        form.key,
        form.code
      );
      const payload = res?.data || {};
      const accessToken = payload.access_token;
      const refreshToken = payload.refresh_token;
      this.setTokenPair({ accessToken, refreshToken });
      try {
        const { useUserStore } = require('./user');
        await useUserStore().refreshPermissionData();
      } catch {
        // ignore
      }
      return payload;
    },

    async refresh() {
      if (this._refreshingPromise) {
        await this._refreshingPromise;
        return this.token;
      }
      if (!this.refreshToken) {
        this.logout();
        throw new Error('No refresh token');
      }

      let tenantId = '000000',
        deptId = '',
        roleId = '';
      try {
        const { useUserStore } = require('./user');
        const u = useUserStore().userInfo;
        tenantId = u?.tenantId || '000000';
        const toCsv = (v) => (Array.isArray(v) ? v.join(',') : v || '');
        deptId = toCsv(u?.depts) || u?.deptId || '';
        roleId = toCsv(u?.roleIds) || u?.roleId || '';
      } catch {
        // ignore
      }

      this._refreshingPromise = (async () => {
        try {
          const res = await Api.auth.refreshToken(this.refreshToken, tenantId, deptId, roleId);
          const payload = res?.data?.data || res?.data || res;
          const accessToken = payload.access_token || payload.accessToken || payload.token;
          const newRefreshToken =
            payload.refresh_token || payload.refreshToken || this.refreshToken;
          if (!accessToken) throw new Error('Refresh response missing access_token');
          this.setTokenPair({ accessToken, refreshToken: newRefreshToken });
          return accessToken;
        } catch (err) {
          this.logout();
          throw err;
        } finally {
          this._refreshingPromise = null;
        }
      })();

      await this._refreshingPromise;
      return this.token;
    },
  },
});
