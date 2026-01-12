import request from '@/utils/http';

export default {
  // 出库列表
  list(params) {
    return request({
      url: '/blade-bip/dc-wms-out-stock/list',
      method: 'get',
      params,
    });
  },

  // 出库详情
  detail(params) {
    return request({
      url: '/blade-bip/dc-wms-out-stock/detail',
      method: 'get',
      params,
    });
  },

  // 出库保存
  submit(data) {
    return request({
      url: '/blade-bip/dc-wms-out-stock/submit-detail',
      method: 'post',
      data,
    });
  },
  // 出库审核
  submitAudit(data) {
    return request({
      url: '/blade-bip/dc-wms-out-stock/submit-audit',
      method: 'post',
      data,
    });
  },

  // 出库驳回
  reject(data) {
    return request({
      url: '/blade-bip/dc-wms-out-stock/reject',
      method: 'post',
      data,
    });
  },

  // 出库删除
  remove(params) {
    return request({
      url: '/blade-bip/dc-wms-out-stock/remove',
      method: 'delete',
      params,
    });
  },
};
