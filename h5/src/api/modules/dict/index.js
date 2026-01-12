import request from '@/utils/http';

export default {
  getDict(params) {
    return request({
      url: '/blade-system/dict-biz/dictionary',
      method: 'get',
      params,
    });
  },
};
