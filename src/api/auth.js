import request from '@/utils/request';
import website from '@/config/website';

export function loginByUsername({
  tenantId = website.tenantId,
  deptId = '',
  roleId = '',
  username,
  password,
  type = 'account',
  key = '',
  code = '',
} = {}) {
  return request({
    url: '/blade-auth/oauth/token',
    method: 'POST',
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
    withToken: false,
  });
}

export function refreshToken(refreshToken, tenantId = website.tenantId, deptId = '', roleId = '') {
  return request({
    url: '/blade-auth/oauth/token',
    method: 'POST',
    headers: {
      'Tenant-Id': tenantId,
      'Dept-Id': website.switchMode ? deptId : '',
      'Role-Id': website.switchMode ? roleId : '',
    },
    params: {
      tenantId,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'all',
    },
    withToken: false,
  });
}
