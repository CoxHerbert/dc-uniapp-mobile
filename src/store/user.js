import Api from '@/api';
import { KEYS } from '@/constants/keys';
import { getStorage, setStorage, removeStorage } from '@/utils/storage';

const isObject = (val) => val && typeof val === 'object' && !Array.isArray(val);

const state = {
  userInfo: getStorage(KEYS.USER_INFO, null),
  loginInfo: getStorage(KEYS.LOGIN_INFO, null),
};

const userStore = {
  get userInfo() {
    return state.userInfo;
  },
  get loginInfo() {
    return state.loginInfo;
  },
  setUserInfo(info) {
    state.userInfo = info;
    if (info) setStorage(KEYS.USER_INFO, info);
    else removeStorage(KEYS.USER_INFO);
  },
  setLoginInfo(info) {
    if (isObject(info)) {
      state.loginInfo = info;
      setStorage(KEYS.LOGIN_INFO, info);
    } else {
      state.loginInfo = null;
      removeStorage(KEYS.LOGIN_INFO);
    }
  },
  mergeLoginInfo(loginInfo) {
    if (!isObject(loginInfo)) {
      this.setLoginInfo(null);
      return;
    }

    const mergedLoginInfo = {
      ...(state.loginInfo || {}),
      ...loginInfo,
    };
    this.setLoginInfo(mergedLoginInfo);

    const mergedUser = {
      ...(state.userInfo || {}),
      ...loginInfo,
    };
    this.setUserInfo(mergedUser);
  },
  reset() {
    this.setUserInfo(null);
    this.setLoginInfo(null);
  },
  async fetchUserInfo() {
    const res = await Api.user.getUserInfo();
    const raw = res?.data?.data || res?.data || {};
    this.setUserInfo(raw || {});
    return raw;
  },
};

export default userStore;
