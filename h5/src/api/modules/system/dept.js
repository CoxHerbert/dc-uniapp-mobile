import request from '@/utils/http';

export default {
  getAllChildTree(params) {
    return request({
      url: '/blade-system/dept/tree-all-child',
      method: 'get',
      params,
    });
  },
};
