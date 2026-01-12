import Api from '@/api';
import {
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
} from '@/utils/auth';
import { encrypt } from '@/utils/sm2';
import userStore from '@/store/user';

const state = {
  token: getToken() || '',
  refreshToken: getRefreshToken() || '',
  refreshing: null,
};

const authStore = {
  get token() {
    return state.token;
  },
  get isLogin() {
    return !!state.token;
  },
  setTokenPair({ accessToken, refreshToken }) {
    if (accessToken) {
      state.token = accessToken;
      setToken(accessToken);
    }
    if (refreshToken) {
      state.refreshToken = refreshToken;
      setRefreshToken(refreshToken);
    }
  },
  clearToken() {
    state.token = '';
    removeToken();
  },
  clearRefreshToken() {
    state.refreshToken = '';
    removeRefreshToken();
  },
  logout() {
    this.clearToken();
    this.clearRefreshToken();
    userStore.reset();
    state.refreshing = null;
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
    return payload;
  },
  async refresh() {
    if (state.refreshing) {
      await state.refreshing;
      return state.token;
    }
    if (!state.refreshToken) {
      this.logout();
      throw new Error('No refresh token');
    }

    const tenantId = userStore.userInfo?.tenantId || '000000';
    const deptId = userStore.userInfo?.deptId || '';
    const roleId = userStore.userInfo?.roleId || '';

    state.refreshing = (async () => {
      try {
        const res = await Api.auth.refreshToken(state.refreshToken, tenantId, deptId, roleId);
        const payload = res?.data?.data || res?.data || res;
        const accessToken = payload.access_token || payload.accessToken || payload.token;
        const newRefreshToken = payload.refresh_token || payload.refreshToken || state.refreshToken;
        if (!accessToken) throw new Error('Refresh response missing access_token');
        this.setTokenPair({ accessToken, refreshToken: newRefreshToken });
        return accessToken;
      } catch (err) {
        this.logout();
        throw err;
      } finally {
        state.refreshing = null;
      }
    })();

    await state.refreshing;
    return state.token;
  },
};

export default authStore;
