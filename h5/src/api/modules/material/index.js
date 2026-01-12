import request from '@/utils/http';

export default {
  getMaterialDetail(params) {
    return request({
      url: '/blade-erp/material/search-material-code',
      method: 'get',
      params,
    });
  },
};
