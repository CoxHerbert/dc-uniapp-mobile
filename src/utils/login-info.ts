export interface LoginInfo {
  token?: string
  refreshToken?: string
  expiresIn?: number
  userId?: string | number
  username?: string
  user?: Record<string, any>
}

const isObject = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

export function extractLoginInfo(payload: any): LoginInfo | null {
  if (!payload || !isObject(payload)) return null

  const possibleInfo =
    payload.login_info || payload.loginInfo || payload.data?.login_info || payload.data?.loginInfo
  if (isObject(possibleInfo)) {
    return {
      ...possibleInfo,
      token:
        possibleInfo.token ||
        possibleInfo.access_token ||
        possibleInfo.accessToken ||
        possibleInfo.access,
    }
  }

  const token = payload.token || payload.access_token || payload.accessToken || payload.data?.token
  const refreshToken = payload.refresh_token || payload.refreshToken
  const expiresIn = payload.expires_in || payload.expiresIn
  const user = payload.user || payload.data?.user || payload.data
  const userId = user?.id || payload.user_id || payload.userId
  const username = user?.username || payload.username

  if (!token && !refreshToken && !userId && !username) return null

  return {
    token,
    refreshToken,
    expiresIn,
    userId,
    username,
    user: isObject(user) ? user : undefined,
  }
}
