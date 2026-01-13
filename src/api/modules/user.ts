import request from '@/utils/http'

export default {
  getUserInfo() {
    return request({
      url: '/blade-system/user/info',
      method: 'GET',
    })
  },
  updatePassword(data: Record<string, any>) {
    return request({
      url: '/blade-system/dc-system-user/update-password',
      method: 'POST',
      data,
    })
  },
  getDataPermissionButtons() {
    return request({
      url: '/blade-system/permission/list-auth',
      method: 'GET',
    })
  },
  getButtons() {
    return request({
      url: '/blade-system/menu/buttons',
      method: 'GET',
    })
  },
}
