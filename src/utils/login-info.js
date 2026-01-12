const isObject = (val) => val && typeof val === 'object' && !Array.isArray(val);

const LOGIN_KEYS = [
  'access_token',
  'refresh_token',
  'token_type',
  'expires_in',
  'tenant_id',
  'user_id',
  'dept_id',
  'post_id',
  'role_id',
  'role_name',
  'account',
  'user_name',
  'nick_name',
  'real_name',
  'avatar',
  'license',
  'oauth_id',
  'rank_weight',
  'detail',
];

function isLoginInfoLike(obj) {
  if (!isObject(obj)) return false;

  const hasToken = typeof obj.access_token === 'string' || typeof obj.accessToken === 'string';

  const hasUser = obj.user_id || obj.userId || obj.account || obj.user_name || obj.userName;

  const hasLoginKey = LOGIN_KEYS.some((key) => key in obj);

  return (hasToken && hasUser) || hasLoginKey;
}

export function extractLoginInfo(payload) {
  if (!isObject(payload)) return null;

  const nestedCandidates = [
    payload?.login_info,
    payload?.loginInfo,
    payload?.data?.login_info,
    payload?.data?.loginInfo,
  ];

  const nested = nestedCandidates.find((info) => isObject(info));

  if (nested) {
    const container = isObject(payload?.data) ? payload.data : payload;
    const info = { ...nested };
    LOGIN_KEYS.forEach((key) => {
      if (info[key] == null && container && container[key] != null) {
        info[key] = container[key];
      }
    });

    return info;
  }

  if (isLoginInfoLike(payload?.data)) {
    return { ...payload.data };
  }

  if (isLoginInfoLike(payload)) {
    return { ...payload };
  }

  return null;
}
