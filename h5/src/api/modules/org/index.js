import request from '@/utils/http';

export default {
  getOrgList(params) {
    return request({
      url: '/blade-bip/org/list-cache',
      method: 'GET',
      params,
    });
  },
};
