import request from '@/utils/http';

export default {
  list(params) {
    return request({
      url: '/blade-bip/dc-wms-out-stock/list',
      method: 'get',
      params,
    });
  },

  detailByCode(params) {
    return request({
      url: '/blade-bip/dc-wms-out-stock/detail-by-code',
      method: 'get',
      params,
    });
  },

  audit(data) {
    return request({
      url: '/blade-bip/dc-wms-out-stock/audit',
      method: 'post',
      data,
    });
  },
};
