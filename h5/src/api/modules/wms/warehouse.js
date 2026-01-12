import request from '@/utils/http';

const prefix = '/blade-bip/dc-wms-warehouse';

const normalize = (res) => res;

export default {
  list(params) {
    return request({
      url: `${prefix}/list`,
      method: 'get',
      params,
    }).then(normalize);
  },

  analyzeBarcode(params) {
    return request({
      url: `/blade-bip/wms-out-stock-opt/analyze-barcode`,
      method: 'get',
      params,
    }).then(normalize);
  },

  codeToGetDetails(data) {
    return request({
      url: `${prefix}/code-to-get-details`,
      method: 'post',
      data,
    }).then(normalize);
  },

  autoOutStock(data) {
    return request({
      url: `${prefix}/auto-out-stock`,
      method: 'post',
      data,
    }).then(normalize);
  },
};
