import { KEYS } from '@/constants/keys';
import { getStorage, setStorage, removeStorage } from '@/utils/storage';

export function getToken() {
  return getStorage(KEYS.ACCESS_TOKEN, '');
}

export function setToken(token) {
  if (token) setStorage(KEYS.ACCESS_TOKEN, token);
}

export function getRefreshToken() {
  return getStorage(KEYS.REFRESH_TOKEN, '');
}

export function setRefreshToken(token) {
  if (token) setStorage(KEYS.REFRESH_TOKEN, token);
}

export function removeToken() {
  removeStorage(KEYS.ACCESS_TOKEN);
}

export function removeRefreshToken() {
  removeStorage(KEYS.REFRESH_TOKEN);
}
