export const KEYS = {
  ACCESS_TOKEN: 'access_token',
  LOGIN_INFO: 'login_info',
  USER_INFO: 'user_info',
  LAST_USERNAME: 'last_username',
}

export type StorageKey = typeof KEYS[keyof typeof KEYS]
