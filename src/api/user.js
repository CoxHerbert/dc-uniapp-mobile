import request from '@/utils/request';

export function getUserInfo() {
  return request({
    url: '/blade-system/user/info',
    method: 'GET',
  });
}

export function updatePassword(data) {
  return request({
    url: '/blade-system/dc-system-user/update-password',
    method: 'POST',
    data,
  });
}

export function getDataPermissionButtons() {
  return request({
    url: '/blade-system/permission/list-auth',
    method: 'GET',
  });
}

export function getButtons() {
  return request({
    url: '/blade-system/menu/buttons',
    method: 'GET',
  });
}
