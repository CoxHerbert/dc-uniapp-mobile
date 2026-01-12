import { KEYS } from '@/constants/keys';

export function getToken() {
  return uni.getStorageSync(KEYS.ACCESS_TOKEN);
}

export function setToken(token) {
  if (!token) return;
  uni.setStorageSync(KEYS.ACCESS_TOKEN, token);
}

export function getRefreshToken() {
  return uni.getStorageSync(KEYS.REFRESH_TOKEN);
}

export function setRefreshToken(token) {
  if (!token) return;
  uni.setStorageSync(KEYS.REFRESH_TOKEN, token);
}

export function removeToken() {
  uni.removeStorageSync(KEYS.SESSION_ID);
  uni.removeStorageSync(KEYS.USER_ID);
  uni.removeStorageSync(KEYS.ACCESS_TOKEN);
}

export function removeRefreshToken() {
  uni.removeStorageSync(KEYS.REFRESH_TOKEN);
}
