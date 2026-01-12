import request from '@/utils/http';

export default {
  getUserInfo() {
    return request({
      url: '/blade-system/user/info',
      method: 'get',
    });
  },
  talentRegister(data) {
    return request({
      url: '/blade-rbac/TalentUser/user-create',
      method: 'post',
      data,
    });
  },
  laborRegister(data) {
    return request({
      url: '/blade-bip/laborRegister/user-create',
      method: 'post',
      data,
    });
  },
  updatePassword(data) {
    return request({
      url: '/blade-system/dc-system-user/update-password',
      method: 'post',
      data,
    });
  },
  getH5UserInfo() {
    return request({
      url: '/blade-bip/home-user/h5-user-info',
      method: 'get',
    });
  },
  getUserDailyAttendanceInfo(params) {
    return request({
      url: '/blade-bip/home-user/user-daily-attendance-info',
      method: 'get',
      params,
    });
  },
  getUser(id) {
    return request({
      url: '/blade-system/user/detail',
      method: 'GET',
      params: {
        id,
      },
    });
  },
  getDataPermissionButtons() {
    return request({
      url: '/blade-system/permission/list-auth',
      method: 'get',
    });
  },
  getButtons() {
    return request({
      url: '/blade-system/menu/buttons',
      method: 'get',
    });
  },
};
