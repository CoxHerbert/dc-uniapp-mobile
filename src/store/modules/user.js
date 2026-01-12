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

const readLoginInfo = () => {
  try {
    const stored = uni.getStorageSync(KEYS.LOGIN_INFO);
    return stored ? (typeof stored === 'string' ? JSON.parse(stored) : stored) : null;
  } catch (error) {
    return null;
  }
};

const state = {
  userInfo: secureStorage.get(KEYS.USER_INFO, null),
  loginInfo: readLoginInfo(),
  permission: secureStorage.get(KEYS.PERMISSION, {}),
  btnPermission: {},
  deptInfo: secureStorage.get(KEYS.DEPT_INFO, null),
};

const getters = {
  userInfo: (state) => state.userInfo,
  loginInfo: (state) => state.loginInfo,
  permission: (state) => state.permission,
  btnPermission: (state) => state.btnPermission,
  deptInfo: (state) => state.deptInfo,
};

const mutations = {
  SET_USER_INFO(state, info) {
    state.userInfo = info;
    if (info) secureStorage.set(KEYS.USER_INFO, info);
    else secureStorage.remove(KEYS.USER_INFO);
  },
  SET_LOGIN_INFO(state, info) {
    if (isObject(info)) {
      state.loginInfo = info;
      uni.setStorageSync(KEYS.LOGIN_INFO, info);
    } else {
      state.loginInfo = null;
      uni.removeStorageSync(KEYS.LOGIN_INFO);
    }
  },
  SET_PERMISSION(state, permission) {
    const codes = flattenPermissionCodes(permission || []);
    const map = {};
    codes.forEach((code) => {
      map[code] = true;
    });
    state.permission = map;
    secureStorage.set(KEYS.PERMISSION, state.permission);
  },
  SET_BTN_PERMISSION(state, permission) {
    state.btnPermission = permission || {};
  },
  SET_DEPT_INFO(state, deptInfo) {
    state.deptInfo = deptInfo || null;
    if (deptInfo) {
      secureStorage.set(KEYS.DEPT_INFO, deptInfo);
    } else {
      secureStorage.remove(KEYS.DEPT_INFO);
    }
  },
};

const actions = {
  mergeLoginInfo({ state, commit }, loginInfo) {
    if (!isObject(loginInfo)) {
      commit('SET_LOGIN_INFO', null);
      return;
    }
    const merged = {
      ...(state.loginInfo || {}),
      ...loginInfo,
    };
    commit('SET_LOGIN_INFO', merged);

    const mergedUser = {
      ...(state.userInfo || {}),
      ...loginInfo,
      dept_name: state.userInfo?.deptName?.toString?.() || '',
      post_name: state.userInfo?.postNames?.toString?.() || '',
    };

    commit('SET_USER_INFO', mergedUser);
  },
  reset({ commit }) {
    commit('SET_USER_INFO', null);
    commit('SET_LOGIN_INFO', null);
    commit('SET_PERMISSION', {});
    commit('SET_BTN_PERMISSION', {});
    commit('SET_DEPT_INFO', null);
    secureStorage.remove(KEYS.PERMISSION);
    secureStorage.remove(KEYS.DEPT_INFO);
  },
  async fetchUserInfo({ dispatch, commit }) {
    const res = await Api.user.getUserInfo();
    const raw = res?.data?.data || res?.data || {};
    const normalized = normalizeUser(raw || {});
    commit('SET_USER_INFO', normalized);
    await dispatch('refreshPermissionData');
    return normalized;
  },
  async changePassword(_ctx, payload = {}) {
    const params = {
      oldPassword: payload.oldPassword,
      newPassword: payload.newPassword,
    };
    await Api.user.updatePassword(params);
  },
  async fetchBtnPermissions({ commit }) {
    try {
      const res = await Api.user.getDataPermissionButtons();
      if (res?.data?.code === 200) {
        commit('SET_BTN_PERMISSION', transformBtnAuths(res?.data?.data?.menu || {}));
      }
    } catch (error) {
      console.error('获取数据级，按钮权限 数据失败', error);
    }
  },
  async fetchButtons({ commit }) {
    const res = await Api.user.getButtons();
    const data = res?.data?.data || [];
    commit('SET_PERMISSION', data);
  },
  async refreshPermissionData({ dispatch }) {
    await Promise.allSettled([dispatch('fetchButtons'), dispatch('fetchBtnPermissions')]);
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
