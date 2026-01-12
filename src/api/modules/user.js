import request from '@/utils/request';

export default {
  getUserInfo() {
    return request({
      url: '/blade-auth/oauth/user-info',
      method: 'GET',
    });
  },
};
