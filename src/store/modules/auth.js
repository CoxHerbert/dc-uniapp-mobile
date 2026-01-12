import Api from '@/api';
import {
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
} from '@/utils/auth';

const state = {
  token: getToken() || null,
  refreshToken: getRefreshToken() || null,
  refreshingPromise: null,
};

const getters = {
  isLogin: (state) => !!state.token,
};

const mutations = {
  SET_TOKEN_PAIR(state, { accessToken, refreshToken }) {
    if (accessToken) {
      state.token = accessToken;
      setToken(accessToken);
    }
    if (refreshToken) {
      state.refreshToken = refreshToken;
      setRefreshToken(refreshToken);
    }
  },
  CLEAR_TOKEN(state) {
    state.token = null;
    removeToken();
  },
  CLEAR_REFRESH_TOKEN(state) {
    state.refreshToken = null;
    removeRefreshToken();
  },
  SET_REFRESHING_PROMISE(state, promise) {
    state.refreshingPromise = promise;
  },
};

const actions = {
  logout({ commit, dispatch }) {
    commit('CLEAR_TOKEN');
    commit('CLEAR_REFRESH_TOKEN');
    commit('SET_REFRESHING_PROMISE', null);
    dispatch('user/reset', null, { root: true });
  },
  async loginByUsername({ commit, dispatch }, form) {
    const res = await Api.auth.loginByUsername({ ...form });
    const payload = res?.data || res;
    const accessToken = payload.access_token;
    const refreshToken = payload.refresh_token;
    commit('SET_TOKEN_PAIR', { accessToken, refreshToken });
    await dispatch('user/refreshPermissionData', null, { root: true });
    return payload;
  },
  async refresh({ state, commit, dispatch, rootGetters }) {
    if (state.refreshingPromise) {
      await state.refreshingPromise;
      return state.token;
    }
    if (!state.refreshToken) {
      dispatch('logout');
      throw new Error('No refresh token');
    }

    const userInfo = rootGetters['user/userInfo'] || {};
    const tenantId = userInfo.tenantId || '000000';
    const toCsv = (value) => (Array.isArray(value) ? value.join(',') : value || '');
    const deptId = toCsv(userInfo.depts) || userInfo.deptId || '';
    const roleId = toCsv(userInfo.roleIds) || userInfo.roleId || '';

    const promise = (async () => {
      try {
        const res = await Api.auth.refreshToken(state.refreshToken, tenantId, deptId, roleId);
        const payload = res?.data?.data || res?.data || res;
        const accessToken = payload.access_token || payload.accessToken || payload.token;
        const newRefreshToken =
          payload.refresh_token || payload.refreshToken || state.refreshToken;
        if (!accessToken) throw new Error('Refresh response missing access_token');
        commit('SET_TOKEN_PAIR', { accessToken, refreshToken: newRefreshToken });
        return accessToken;
      } catch (error) {
        dispatch('logout');
        throw error;
      } finally {
        commit('SET_REFRESHING_PROMISE', null);
      }
    })();

    commit('SET_REFRESHING_PROMISE', promise);
    await promise;
    return state.token;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
