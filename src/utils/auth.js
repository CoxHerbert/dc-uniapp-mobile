import { KEYS } from '@/constants/keys';
import { storage } from '@/utils/storage';

export function getToken() {
  return storage.get(KEYS.ACCESS_TOKEN);
}

export function setToken(token) {
  storage.set(KEYS.ACCESS_TOKEN, token);
  return token;
}

export function getRefreshToken() {
  return storage.get(KEYS.REFRESH_TOKEN);
}

export function setRefreshToken(token) {
  storage.set(KEYS.REFRESH_TOKEN, token);
  return token;
}

export function removeToken() {
  storage.remove(KEYS.SESSION_ID);
  storage.remove(KEYS.USER_ID);
  storage.remove(KEYS.ACCESS_TOKEN);
}

export function removeRefreshToken() {
  storage.remove(KEYS.REFRESH_TOKEN);
}
