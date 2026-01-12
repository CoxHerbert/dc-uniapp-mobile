import request from '@/utils/http';

import website from '@/config/website';

export default {
  // 微信或者企业微信授权
  authorize(params) {
    return request({
      url: '/blade-bip/wechat/public-account/authorize',
      method: 'GET',
      params,
    });
  },
  // 微信或者企业微信授权
  authRender(params, source) {
    return request({
      url: `/blade-auth/social/skip-url/oauth/render/${source}`,
      method: 'GET',
      params,
    });
  },
  // 微信登录
  loginBySocial(data) {
    return request({
      url: '/blade-auth/oauth/token',
      method: 'post',
      headers: {
        'Tenant-Id': '000000',
      },
      params: {
        tenantId: '000000',
        ...data,
        grant_type: 'social',
        scope: 'all',
      },
    });
  },
  loginByUsername(tenantId, deptId, roleId, username, password, type, key, code) {
    return request({
      url: '/blade-auth/oauth/token',
      method: 'post',
      headers: {
        'Tenant-Id': tenantId,
        'Dept-Id': website.switchMode ? deptId : '',
        'Role-Id': website.switchMode ? roleId : '',
        'Captcha-Key': key,
        'Captcha-Code': code,
      },
      params: {
        tenantId,
        username,
        password,
        grant_type: website.captchaMode ? 'captcha' : 'password',
        scope: 'all',
        type,
      },
    });
  },
  // 刷新token
  refreshToken(refresh_token, tenantId = '000000', deptId, roleId) {
    return request({
      url: '/blade-auth/oauth/token',
      method: 'post',
      noErrorMsg: true,
      headers: {
        'Tenant-Id': tenantId,
        'Dept-Id': website.switchMode ? deptId : '',
        'Role-Id': website.switchMode ? roleId : '',
      },
      params: {
        tenantId,
        refresh_token,
        grant_type: 'refresh_token',
        scope: 'all',
      },
    });
  },
  // 根据uuid获取用户信息
  consumeTicket(params) {
    return request({
      url: '/blade-message/url-match-ticket/skip-url/consume-ticket',
      method: 'GET',
      params,
    });
  },
};
