// src/utils/login-info.js
const isObject = (val) => val && typeof val === 'object' && !Array.isArray(val);

// 典型登录字段（bladex那一套）
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

// 粗略判断一个对象是不是“登录信息”
function isLoginInfoLike(obj) {
  if (!isObject(obj)) return false;

  const hasToken = typeof obj.access_token === 'string' || typeof obj.accessToken === 'string';

  const hasUser = obj.user_id || obj.userId || obj.account || obj.user_name || obj.userName;

  const hasLoginKey = LOGIN_KEYS.some((key) => key in obj);

  return (hasToken && hasUser) || hasLoginKey;
}

export function extractLoginInfo(payload) {
  if (!isObject(payload)) return null;

  // 1. 先走你原来的几种 login_info / loginInfo 写法
  const nestedCandidates = [
    payload?.login_info,
    payload?.loginInfo,
    payload?.data?.login_info,
    payload?.data?.loginInfo,
  ];

  const nested = nestedCandidates.find((info) => isObject(info));

  if (nested) {
    // login_info 里一般是 userId/account 这些
    // access_token / refresh_token 等有时在外层，这里合并一下，保证字段齐全
    const container = isObject(payload?.data) ? payload.data : payload;
    const info = { ...nested };
    LOGIN_KEYS.forEach((key) => {
      if (info[key] == null && container && container[key] != null) {
        info[key] = container[key];
      }
    });

    return info;
  }

  // 2. 不存在 login_info 的情况：尝试把 payload.data 当成完整登录对象
  if (isLoginInfoLike(payload?.data)) {
    return { ...payload.data };
  }

  // 3. 再尝试把 payload 本身当成完整登录对象（你贴的就是这种）
  if (isLoginInfoLike(payload)) {
    return { ...payload };
  }

  // 都不像，就认为没有登录信息
  return null;
}
