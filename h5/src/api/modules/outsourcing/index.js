import request from '@/utils/http';

export default {
  /**
   * 供应商查询
   */
  getSupplierList(params) {
    return request({
      url: '/blade-bip/dc/mes/transfer/supplier-list',
      method: 'get',
      params,
    });
  },

  /**
   * 获取外发单可选工序
   */
  getReferenceProcessByErpId(params) {
    return request({
      url: '/blade-bip/dc/mes/forward/get-reference-process-by-erp-id',
      method: 'get',
      params,
    });
  },

  /**
   * H5扫码第一步
   */
  searchMaterial(params) {
    return request({
      url: '/blade-pda/stock-in/search-material',
      method: 'get',
      params,
    });
  },
  /**
   * H5扫码第二步
   */
  getProcessDetailList(data) {
    return request({
      url: '/blade-bip/dc/mes/forward/get-process-detail-list',
      method: 'post',
      data,
    });
  },

  /**
   * H5外发单提交
   */
  batchErpSubmitH5(data) {
    return request({
      url: '/blade-bip/dc/mes/forward/batch-erp-submit-h5',
      method: 'post',
      data,
    });
  },
};
